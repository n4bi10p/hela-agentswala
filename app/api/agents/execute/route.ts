import { NextResponse } from "next/server";
import { runBusinessAgent } from "../business/route";
import { runContentAgent } from "../content/route";
import { runFarmingAgent } from "../farming/route";
import { runRebalancingAgent } from "../rebalancing/route";
import { runSchedulingAgent } from "../scheduling/route";
import { runTradingAgent } from "../trading/route";

type AgentType = "trading" | "farming" | "scheduling" | "rebalancing" | "content" | "business";

type ExecuteInput = {
  agentType: AgentType;
  payload: unknown;
};

type RouteError = {
  statusCode?: number;
  message?: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateTradingPayload(payload: Record<string, unknown>) {
  if (typeof payload.tokenPair !== "string" || !payload.tokenPair.trim()) {
    throw { statusCode: 400, message: "payload.tokenPair is required." };
  }
  if (!isFiniteNumber(payload.thresholdPrice)) {
    throw { statusCode: 400, message: "payload.thresholdPrice must be a valid number." };
  }
  if (typeof payload.action !== "string" || !payload.action.trim()) {
    throw { statusCode: 400, message: "payload.action is required." };
  }
  if (!isFiniteNumber(payload.amount) || payload.amount <= 0) {
    throw { statusCode: 400, message: "payload.amount must be a number greater than 0." };
  }
  if (!isFiniteNumber(payload.currentPrice)) {
    throw { statusCode: 400, message: "payload.currentPrice must be a valid number." };
  }
}

function validateFarmingPayload(payload: Record<string, unknown>) {
  if (typeof payload.lpAddress !== "string" || !payload.lpAddress.trim()) {
    throw { statusCode: 400, message: "payload.lpAddress is required." };
  }
  if (!isFiniteNumber(payload.compoundThreshold)) {
    throw { statusCode: 400, message: "payload.compoundThreshold must be a valid number." };
  }
  if (!isFiniteNumber(payload.currentAPY)) {
    throw { statusCode: 400, message: "payload.currentAPY must be a valid number." };
  }
}

function validateSchedulingPayload(payload: Record<string, unknown>) {
  if (typeof payload.recipient !== "string" || !payload.recipient.trim()) {
    throw { statusCode: 400, message: "payload.recipient is required." };
  }
  if (!isFiniteNumber(payload.amount) || payload.amount <= 0) {
    throw { statusCode: 400, message: "payload.amount must be a number greater than 0." };
  }
  if (
    typeof payload.frequency !== "string" ||
    !["hourly", "daily", "weekly", "monthly"].includes(payload.frequency)
  ) {
    throw {
      statusCode: 400,
      message: "payload.frequency must be one of hourly, daily, weekly, monthly."
    };
  }
  if (typeof payload.startDate !== "string" || !payload.startDate.trim()) {
    throw { statusCode: 400, message: "payload.startDate is required." };
  }
}

function validateAllocationMap(value: unknown, fieldName: string) {
  if (!value || typeof value !== "object") {
    throw { statusCode: 400, message: `payload.${fieldName} must be a JSON object of numeric values.` };
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) {
    throw { statusCode: 400, message: `payload.${fieldName} must not be empty.` };
  }

  for (const [, allocation] of entries) {
    if (!isFiniteNumber(allocation) || allocation < 0) {
      throw {
        statusCode: 400,
        message: `payload.${fieldName} values must be non-negative finite numbers.`
      };
    }
  }
}

function validateRebalancingPayload(payload: Record<string, unknown>) {
  validateAllocationMap(payload.targetAllocations, "targetAllocations");
  validateAllocationMap(payload.currentAllocations, "currentAllocations");

  if (!isFiniteNumber(payload.driftTolerance) || payload.driftTolerance < 0) {
    throw { statusCode: 400, message: "payload.driftTolerance must be a non-negative number." };
  }
}

function validateContentPayload(payload: Record<string, unknown>) {
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    throw { statusCode: 400, message: "payload.message is required." };
  }
  if (typeof payload.brandContext !== "string" || !payload.brandContext.trim()) {
    throw { statusCode: 400, message: "payload.brandContext is required." };
  }
  if (
    typeof payload.tone !== "string" ||
    !["professional", "casual", "aggressive"].includes(payload.tone)
  ) {
    throw { statusCode: 400, message: "payload.tone must be professional, casual, or aggressive." };
  }
}

function validateBusinessPayload(payload: Record<string, unknown>) {
  if (typeof payload.query !== "string" || !payload.query.trim()) {
    throw { statusCode: 400, message: "payload.query is required." };
  }
  if (typeof payload.businessContext !== "string" || !payload.businessContext.trim()) {
    throw { statusCode: 400, message: "payload.businessContext is required." };
  }
  if (typeof payload.language !== "string" || !payload.language.trim()) {
    throw { statusCode: 400, message: "payload.language is required." };
  }
  if (typeof payload.formality !== "string" || !["formal", "informal"].includes(payload.formality)) {
    throw { statusCode: 400, message: "payload.formality must be formal or informal." };
  }
}

function validateAgentPayload(agentType: AgentType, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw { statusCode: 400, message: "payload must be a JSON object." };
  }

  const shape = payload as Record<string, unknown>;

  if (agentType === "trading") {
    validateTradingPayload(shape);
    return;
  }
  if (agentType === "farming") {
    validateFarmingPayload(shape);
    return;
  }
  if (agentType === "scheduling") {
    validateSchedulingPayload(shape);
    return;
  }
  if (agentType === "rebalancing") {
    validateRebalancingPayload(shape);
    return;
  }
  if (agentType === "content") {
    validateContentPayload(shape);
    return;
  }

  validateBusinessPayload(shape);
}

function parseInput(body: unknown): ExecuteInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<ExecuteInput>;
  if (!input.agentType || typeof input.agentType !== "string") {
    throw { statusCode: 400, message: "agentType is required." };
  }
  if (!("payload" in input)) {
    throw { statusCode: 400, message: "payload is required." };
  }
  const allowed: AgentType[] = ["trading", "farming", "scheduling", "rebalancing", "content", "business"];
  if (!allowed.includes(input.agentType as AgentType)) {
    throw { statusCode: 400, message: "agentType is invalid." };
  }

  validateAgentPayload(input.agentType as AgentType, input.payload);

  return {
    agentType: input.agentType as AgentType,
    payload: input.payload
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);

    let result: unknown;

    if (input.agentType === "trading") {
      result = await runTradingAgent(input.payload as never);
    } else if (input.agentType === "farming") {
      result = await runFarmingAgent(input.payload as never);
    } else if (input.agentType === "scheduling") {
      result = runSchedulingAgent(input.payload as never);
    } else if (input.agentType === "rebalancing") {
      result = await runRebalancingAgent(input.payload as never);
    } else if (input.agentType === "content") {
      result = await runContentAgent(input.payload as never);
    } else {
      result = await runBusinessAgent(input.payload as never);
    }

    return NextResponse.json(
      {
        agentType: input.agentType,
        result
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
