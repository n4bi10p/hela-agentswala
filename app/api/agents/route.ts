import { formatUnits } from "ethers";
import { NextResponse } from "next/server";
import { fetchAgentActivationCount, fetchAllAgents } from "@/lib/contracts";
import {
  getAgentImage,
  isHiddenAgentName,
  normalizeAgentDescription,
  toAgentTypeLabel
} from "@/lib/agentUi";

type AgentListItem = {
  id: number;
  name: string;
  description: string;
  agentType: string;
  type: string;
  price: number;
  activeCount: number;
  isLive: boolean;
  image: string;
  configSchema: string;
  developer: string;
};

function toPrice(priceWei: bigint): number {
  const parsed = Number(formatUnits(priceWei, 18));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Number(parsed.toFixed(6));
}

export async function GET() {
  try {
    const agents = await fetchAllAgents();

    const activeCounts = await Promise.all(
      agents.map(async (agent) => {
        try {
          return await fetchAgentActivationCount(Number(agent.id));
        } catch {
          return 0;
        }
      })
    );

    const response: AgentListItem[] = agents
      .map((agent, index) => ({
        id: Number(agent.id),
        name: agent.name,
        description: normalizeAgentDescription(agent.agentType, agent.description),
        agentType: agent.agentType,
        type: toAgentTypeLabel(agent.agentType),
        price: toPrice(agent.priceHLUSD),
        activeCount: activeCounts[index] ?? 0,
        isLive: agent.isActive,
        image: getAgentImage(agent.agentType),
        configSchema: agent.configSchema,
        developer: agent.developer
      }))
      .filter((agent) => !isHiddenAgentName(agent.name))
      .sort((left, right) => right.id - left.id);

    return NextResponse.json({ agents: response }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch agents." }, { status: 500 });
  }
}
