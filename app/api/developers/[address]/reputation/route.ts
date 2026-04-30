import { NextResponse } from "next/server";
import { fetchDeveloperReputation } from "@/lib/reputation";
import { listStoredAgents } from "@/lib/automationStore";
import { fetchAgentActivationCount } from "@/lib/contracts";

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

    const reputation = await fetchDeveloperReputation(developerAddress, agentIds);

    // Enrich with total activation count across all dev's agents
    let totalActivations = 0;
    for (const agent of devAgents) {
      const agentNum = Number(agent.agentId);
      if (Number.isFinite(agentNum)) {
        const count = await fetchAgentActivationCount(agentNum).catch(() => 0);
        totalActivations += count;
      }
    }

    return NextResponse.json(
      { ...reputation, totalActivations },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch developer reputation" },
      { status: 500 }
    );
  }
}
