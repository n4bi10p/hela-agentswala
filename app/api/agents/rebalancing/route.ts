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

export async function runRebalancingAgent(input: RebalancingInput): Promise<RebalancingResult> {
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
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Rebalancing agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
