import { NextResponse } from "next/server";
import { callGemini } from "../../../../lib/gemini";

type AllocationMap = Record<string, number>;

type RebalancingInput = {
  targetAllocations: AllocationMap;
  currentAllocations: AllocationMap;
  driftTolerance: number;
};

type DriftEntry = {
  target: number;
  current: number;
  drift: number;
};

type RebalancingResult = {
  needsRebalance: boolean;
  driftReport: {
    simulated: true;
    perToken: Record<string, DriftEntry>;
    maxDrift: number;
  };
  recommendation: string;
};

type RouteError = {
  statusCode?: number;
  message?: string;
};

function humanizeFieldName(field: string): string {
  const withoutPrefix = field.replace(/^payload\./, "");
  return withoutPrefix
    .replace(/\./g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function toNaturalLanguageError(status: number, rawMessage: string | undefined, serverFallback: string): string {
  if (status >= 500) {
    return serverFallback;
  }

  const message = (rawMessage || "").trim();
  if (!message) {
    return "We could not understand the request. Please check your input and try again.";
  }

  if (message === "Malformed JSON body.") {
    return "The request body is not valid JSON. Please fix the JSON format and try again.";
  }
  if (message === "Request body must be a JSON object.") {
    return "Please send a JSON object in the request body.";
  }
  if (message === "payload must be a JSON object.") {
    return "Please send payload as a JSON object.";
  }
  if (message === "agentType is invalid.") {
    return "The selected agent type is not supported. Use trading, farming, scheduling, rebalancing, content, or business.";
  }
  if (message === "Gemini rate limit reached. Please retry shortly.") {
    return "The AI service is busy right now. Please retry in a moment.";
  }
  if (message === "Prompt cannot be empty.") {
    return "Please enter a message before sending the request.";
  }
  if (message === "Prompt is too large." || message === "System context is too large.") {
    return "Your request is too long. Please shorten it and try again.";
  }

  const requiredMatch = message.match(/^(.+) is required\.$/);
  if (requiredMatch) {
    return `Please provide ${humanizeFieldName(requiredMatch[1])}.`;
  }

  const validNumberMatch = message.match(/^(.+) must be a valid number\.$/);
  if (validNumberMatch) {
    return `Please provide a valid number for ${humanizeFieldName(validNumberMatch[1])}.`;
  }

  const positiveNumberMatch = message.match(/^(.+) must be a number greater than 0\.$/);
  if (positiveNumberMatch) {
    return `Please provide a number greater than 0 for ${humanizeFieldName(positiveNumberMatch[1])}.`;
  }

  const nonNegativeNumberMatch = message.match(/^(.+) must be a non-negative number\.$/);
  if (nonNegativeNumberMatch) {
    return `Please provide a non-negative number for ${humanizeFieldName(nonNegativeNumberMatch[1])}.`;
  }

  const oneOfMatch = message.match(/^(.+) must be one of (.+)\.$/);
  if (oneOfMatch) {
    return `Please choose ${humanizeFieldName(oneOfMatch[1])} from: ${oneOfMatch[2]}.`;
  }

  const numericObjectMatch = message.match(/^(.+) must be a non-empty object of numeric values\.$/);
  if (numericObjectMatch) {
    return `Please provide ${humanizeFieldName(numericObjectMatch[1])} as a non-empty object with numeric values.`;
  }

  return "Please review your request and try again.";
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isAllocationMap(value: unknown): value is AllocationMap {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entries = Object.values(value as AllocationMap);
  return entries.length > 0 && entries.every((v) => isValidNumber(v) && v >= 0);
}

function parseInput(body: unknown): RebalancingInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<RebalancingInput>;
  if (!isAllocationMap(input.targetAllocations)) {
    throw { statusCode: 400, message: "targetAllocations must be a non-empty object of numeric values." };
  }
  if (!isAllocationMap(input.currentAllocations)) {
    throw { statusCode: 400, message: "currentAllocations must be a non-empty object of numeric values." };
  }
  if (!isValidNumber(input.driftTolerance) || input.driftTolerance < 0) {
    throw { statusCode: 400, message: "driftTolerance must be a non-negative number." };
  }

  return {
    targetAllocations: input.targetAllocations,
    currentAllocations: input.currentAllocations,
    driftTolerance: input.driftTolerance
  };
}

async function runRebalancingAgent(input: RebalancingInput): Promise<RebalancingResult> {
  const tokens = Array.from(
    new Set([...Object.keys(input.targetAllocations), ...Object.keys(input.currentAllocations)])
  );

  const perToken: Record<string, DriftEntry> = {};
  let maxDrift = 0;

  for (const token of tokens) {
    const target = input.targetAllocations[token] ?? 0;
    const current = input.currentAllocations[token] ?? 0;
    const drift = Number(Math.abs(target - current).toFixed(4));
    perToken[token] = { target, current, drift };
    if (drift > maxDrift) {
      maxDrift = drift;
    }
  }

  const needsRebalance = maxDrift > input.driftTolerance;

  let recommendation = "[SIMULATED] Allocation drift is within tolerance. No rebalance needed.";
  if (needsRebalance) {
    try {
      recommendation = await callGemini(
        [
          "You are a portfolio risk assistant.",
          "Provide a plain-English rebalance recommendation in 2-4 sentences.",
          `Drift tolerance: ${input.driftTolerance}`,
          `Computed maximum drift: ${maxDrift}`,
          `Per-token drift JSON: ${JSON.stringify(perToken)}`
        ].join("\n")
      );
    } catch {
      recommendation = "[SIMULATED] Drift exceeds tolerance. Rebalancing is recommended, but AI guidance is currently unavailable.";
    }
  }

  return {
    needsRebalance,
    driftReport: {
      simulated: true,
      perToken,
      maxDrift: Number(maxDrift.toFixed(4))
    },
    recommendation
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);
    const result = await runRebalancingAgent(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: toNaturalLanguageError(400, "Malformed JSON body.", "Rebalancing agent execution failed.")
        },
        { status: 400 }
      );
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = toNaturalLanguageError(status, mapped.message, "Rebalancing agent execution failed.");
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
