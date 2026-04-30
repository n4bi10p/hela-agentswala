import { NextResponse } from "next/server";
import { fetchDeveloperReputation } from "@/lib/reputation";
import { listStoredAgents } from "@/lib/automationStore";
import { fetchAgentActivationCount, fetchAgentExecutionCount } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const developerAddress = params.address?.trim().toLowerCase();

  if (!developerAddress) {
    return NextResponse.json({ error: "Developer address is required" }, { status: 400 });
  }

  try {
    const storedAgents = await listStoredAgents().catch(() => []);
    const devAgents = storedAgents.filter(
      (a) => a.developerAddress?.toLowerCase() === developerAddress
    );
    const agentIds = devAgents.map((a) => String(a.agentId));

    // Calculate metrics across all dev's agents before fetching reputation
    let totalActivations = 0;
    let totalExecutions = 0;
    for (const agent of devAgents) {
      const agentNum = Number(agent.agentId);
      if (Number.isFinite(agentNum)) {
        const [actCount, execCount] = await Promise.all([
          fetchAgentActivationCount(agentNum).catch(() => 0),
          fetchAgentExecutionCount(agentNum).catch(() => 0)
        ]);
        totalActivations += actCount;
        totalExecutions += execCount;
      }
    }

    const reputation = await fetchDeveloperReputation(
      developerAddress,
      agentIds,
      totalActivations,
      totalExecutions
    );

    return NextResponse.json(reputation, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch developer reputation" },
      { status: 500 }
    );
  }
}
