import { NextResponse } from "next/server";
import { callGemini } from "../../../../lib/gemini";

type FarmingInput = {
  lpAddress: string;
  compoundThreshold: number;
  currentAPY: number;
};

type FarmingResult = {
  shouldCompound: boolean;
  recommendation: string;
  simulatedYield: number;
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

  if (message === "startDate must be a valid ISO date string.") {
    return "Please provide start date in valid ISO format, for example 2026-04-18T00:00:00.000Z.";
  }

  return "Please review your request and try again.";
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseInput(body: unknown): FarmingInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<FarmingInput>;
  if (!input.lpAddress || typeof input.lpAddress !== "string") {
    throw { statusCode: 400, message: "lpAddress is required." };
  }
  if (!isValidNumber(input.compoundThreshold)) {
    throw { statusCode: 400, message: "compoundThreshold must be a valid number." };
  }
  if (!isValidNumber(input.currentAPY)) {
    throw { statusCode: 400, message: "currentAPY must be a valid number." };
  }

  return {
    lpAddress: input.lpAddress.trim(),
    compoundThreshold: input.compoundThreshold,
    currentAPY: input.currentAPY
  };
}

async function runFarmingAgent(input: FarmingInput): Promise<FarmingResult> {
  const shouldCompound = input.currentAPY >= input.compoundThreshold;
  const simulatedYield = Number((input.currentAPY * 1.015).toFixed(2));

  let recommendation = "[SIMULATED] APY below threshold. Hold rewards and review later.";

  if (shouldCompound) {
    try {
      recommendation = await callGemini(
        [
          "You are a DeFi yield farming advisor.",
          "Explain APY and recommend whether compounding is appropriate in 2-3 concise sentences.",
          `LP address: ${input.lpAddress}`,
          `Compound threshold: ${input.compoundThreshold}`,
          `Current APY: ${input.currentAPY}`,
          `Simulated yield estimate: ${simulatedYield}`
        ].join("\n")
      );
    } catch {
      recommendation = "[SIMULATED] APY is above threshold. Compound is recommended, but AI guidance is currently unavailable.";
    }
  }

  return {
    shouldCompound,
    recommendation,
    simulatedYield
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);
    const result = await runFarmingAgent(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: toNaturalLanguageError(400, "Malformed JSON body.", "Farming agent execution failed.")
        },
        { status: 400 }
      );
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = toNaturalLanguageError(status, mapped.message, "Farming agent execution failed.");
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
