import { NextResponse } from "next/server";
import { callGemini } from "../../../../lib/gemini";

type TradingInput = {
  tokenPair: string;
  thresholdPrice: number;
  action: string;
  amount: number;
  currentPrice: number;
};

type TradingResult = {
  triggered: boolean;
  analysis: string;
  simulatedAction: string;
};

type RouteError = {
  statusCode?: number;
  message?: string;
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseInput(body: unknown): TradingInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<TradingInput>;
  if (!input.tokenPair || typeof input.tokenPair !== "string") {
    throw { statusCode: 400, message: "tokenPair is required." };
  }
  if (!input.action || typeof input.action !== "string") {
    throw { statusCode: 400, message: "action is required." };
  }
  if (!isValidNumber(input.thresholdPrice)) {
    throw { statusCode: 400, message: "thresholdPrice must be a valid number." };
  }
  if (!isValidNumber(input.currentPrice)) {
    throw { statusCode: 400, message: "currentPrice must be a valid number." };
  }
  if (!isValidNumber(input.amount) || input.amount <= 0) {
    throw { statusCode: 400, message: "amount must be a number greater than 0." };
  }

  return {
    tokenPair: input.tokenPair.trim(),
    thresholdPrice: input.thresholdPrice,
    action: input.action.trim().toLowerCase(),
    amount: input.amount,
    currentPrice: input.currentPrice
  };
}

function isTriggered(input: TradingInput): boolean {
  if (input.action === "buy") {
    return input.currentPrice <= input.thresholdPrice;
  }
  if (input.action === "sell") {
    return input.currentPrice >= input.thresholdPrice;
  }
  return Math.abs(input.currentPrice - input.thresholdPrice) < Number.EPSILON;
}

export async function runTradingAgent(input: TradingInput): Promise<TradingResult> {
  const triggered = isTriggered(input);

  let analysis = "[SIMULATED] Threshold not crossed. No market analysis required yet.";
  if (triggered) {
    try {
      analysis = await callGemini(
        [
          "You are a crypto market assistant.",
          "Provide a short market analysis in 2-3 sentences.",
          `Token pair: ${input.tokenPair}`,
          `Action: ${input.action}`,
          `Threshold price: ${input.thresholdPrice}`,
          `Current price: ${input.currentPrice}`,
          `Amount: ${input.amount}`
        ].join("\n")
      );
    } catch {
      analysis = "[SIMULATED] Trigger fired, but AI market analysis is temporarily unavailable.";
    }
  }

  return {
    triggered,
    analysis,
    simulatedAction: triggered
      ? `[SIMULATED] ${input.action.toUpperCase()} ${input.amount} ${input.tokenPair} at ${input.currentPrice}`
      : `[SIMULATED] No trade executed for ${input.tokenPair}`
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);
    const result = await runTradingAgent(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Trading agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
