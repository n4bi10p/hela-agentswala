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
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Scheduling agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
