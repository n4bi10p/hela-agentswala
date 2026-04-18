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

  return "Please review your request and try again.";
}

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

async function runTradingAgent(input: TradingInput): Promise<TradingResult> {
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
      return NextResponse.json(
        {
          error: toNaturalLanguageError(400, "Malformed JSON body.", "Trading agent execution failed.")
        },
        { status: 400 }
      );
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = toNaturalLanguageError(status, mapped.message, "Trading agent execution failed.");
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
