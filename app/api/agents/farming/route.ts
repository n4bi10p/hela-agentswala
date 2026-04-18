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

export async function runFarmingAgent(input: FarmingInput): Promise<FarmingResult> {
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
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Farming agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
