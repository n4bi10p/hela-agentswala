import { NextResponse } from "next/server";

type ScheduleFrequency = "hourly" | "daily" | "weekly" | "monthly";

type SchedulingInput = {
  recipient: string;
  amount: number;
  frequency: ScheduleFrequency;
  startDate: string;
};

type SchedulingResult = {
  nextExecution: string;
  confirmation: string;
  status: "scheduled";
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

function addInterval(date: Date, frequency: ScheduleFrequency): Date {
  const next = new Date(date);
  if (frequency === "hourly") {
    next.setHours(next.getHours() + 1);
  } else if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function parseInput(body: unknown): SchedulingInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<SchedulingInput>;
  if (!input.recipient || typeof input.recipient !== "string") {
    throw { statusCode: 400, message: "recipient is required." };
  }
  if (!isValidNumber(input.amount) || input.amount <= 0) {
    throw { statusCode: 400, message: "amount must be a number greater than 0." };
  }
  if (!input.frequency || !["hourly", "daily", "weekly", "monthly"].includes(input.frequency)) {
    throw { statusCode: 400, message: "frequency must be one of hourly, daily, weekly, monthly." };
  }
  if (!input.startDate || typeof input.startDate !== "string") {
    throw { statusCode: 400, message: "startDate is required." };
  }

  return {
    recipient: input.recipient.trim(),
    amount: input.amount,
    frequency: input.frequency as ScheduleFrequency,
    startDate: input.startDate
  };
}

export function runSchedulingAgent(input: SchedulingInput): SchedulingResult {
  const start = new Date(input.startDate);
  if (Number.isNaN(start.getTime())) {
    throw { statusCode: 400, message: "startDate must be a valid ISO date string." };
  }

  const now = new Date();
  let nextExecution = new Date(start);
  while (nextExecution <= now) {
    nextExecution = addInterval(nextExecution, input.frequency);
  }

  return {
    nextExecution: nextExecution.toISOString(),
    confirmation: `Scheduled ${input.amount} to ${input.recipient} on a ${input.frequency} cadence.`,
    status: "scheduled"
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);
    const result = runSchedulingAgent(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: toNaturalLanguageError(400, "Malformed JSON body.", "Scheduling agent execution failed.")
        },
        { status: 400 }
      );
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = toNaturalLanguageError(status, mapped.message, "Scheduling agent execution failed.");
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
