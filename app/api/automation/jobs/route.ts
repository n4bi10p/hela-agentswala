import { NextResponse } from "next/server";
import { createAgentJob, getStoredAgent, listAgentJobs, listJobsForOwner } from "@/lib/automationStore";
import type { AgentJobConfig, AutomationFrequency } from "@/types/agent";

type CreateJobBody = {
  agentId?: string;
  ownerAddress?: string;
  frequency?: AutomationFrequency;
  nextRunAt?: string;
  userConfig?: AgentJobConfig;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidFrequency(value: unknown): value is AutomationFrequency {
  return value === "hourly" || value === "daily" || value === "weekly" || value === "monthly";
}

function validateCreateBody(body: unknown): CreateJobBody {
  if (!isRecord(body)) {
    throw new Error("Request body must be an object");
  }

  const nextRunAt = typeof body.nextRunAt === "string" && body.nextRunAt.trim()
    ? body.nextRunAt.trim()
    : new Date().toISOString();

  if (typeof body.agentId !== "string" || !body.agentId.trim()) {
    throw new Error("agentId is required");
  }
  if (typeof body.ownerAddress !== "string" || !body.ownerAddress.trim()) {
    throw new Error("ownerAddress is required");
  }
  if (!isValidFrequency(body.frequency)) {
    throw new Error("frequency must be hourly, daily, weekly, or monthly");
  }
  if (!isRecord(body.userConfig)) {
    throw new Error("userConfig must be an object");
  }
  if (Number.isNaN(new Date(nextRunAt).getTime())) {
    throw new Error("nextRunAt must be a valid ISO date");
  }

  return {
    agentId: body.agentId.trim(),
    ownerAddress: body.ownerAddress.trim(),
    frequency: body.frequency,
    nextRunAt,
    userConfig: body.userConfig
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerAddress = searchParams.get("ownerAddress");

  const jobs = ownerAddress ? listJobsForOwner(ownerAddress) : listAgentJobs();
  return NextResponse.json({ jobs }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = validateCreateBody(await req.json());
    const storedAgent = getStoredAgent(body.agentId!);

    if (!storedAgent) {
      return NextResponse.json({ error: "Stored agent not found for agentId" }, { status: 404 });
    }

    const job = createAgentJob({
      agentId: body.agentId!,
      ownerAddress: body.ownerAddress!,
      frequency: body.frequency!,
      nextRunAt: body.nextRunAt!,
      status: "active",
      userConfig: body.userConfig!,
      lastResult: undefined,
      lastError: undefined,
      lastExecutionTxHash: undefined
    });

    return NextResponse.json(
      {
        job,
        agentWalletAddress: storedAgent.agentWalletAddress
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create automation job"
      },
      { status: 400 }
    );
  }
}
