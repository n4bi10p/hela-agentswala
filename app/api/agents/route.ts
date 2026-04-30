import fs from "node:fs";
import path from "node:path";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { NextResponse } from "next/server";
import { fetchAgentActivationCount, fetchAllAgents } from "@/lib/contracts";
import { listStoredAgents } from "@/lib/automationStore";
import {
  getAgentImage,
  isHiddenAgentName,
  normalizeAgentDescription,
  toAgentTypeLabel
} from "@/lib/agentUi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type DeploymentAddresses = {
  agentRegistry?: string;
  agentEscrow?: string;
  agentExecutor?: string;
};

const AGENT_REGISTRY_ABI = [
  "function getAllAgents() view returns ((uint256 id,string name,string description,string agentType,uint256 priceHLUSD,address developer,bool isActive,string configSchema)[])"
];

const AGENT_ESCROW_ABI = [
  "function getActivationCountForAgent(uint256 agentId) view returns (uint256)"
];

const CANONICAL_AGENT_NAMES: Record<string, string> = {
  trading: "Trading Agent",
  farming: "Farming Agent",
  scheduling: "Scheduling Agent",
  rebalancing: "Portfolio Rebalancing Agent",
  content: "Content Reply Agent",
  business: "Business Assistant Agent"
};

const MARKETPLACE_EXCLUDED_NAME_PATTERNS: RegExp[] = [
  /\bdemo\b/i,
  /\bguided\b/i,
  /\btechnical\b/i,
  /\bbackend\b/i,
  /\bname\s+suggest(?:or|er)?\b/i,
  /\bname\s+creator\b/i,
  /\bbaby\b/i,
  /\bpet\b/i
];

const DEPLOYMENT_FILES = [
  path.join(process.cwd(), "deployments", "latest.json"),
  path.join(process.cwd(), "deployments", "helaTestnet.json")
];

function getRpcUrl() {
  return (
    process.env.NEXT_PUBLIC_HELA_RPC ||
    process.env.HELA_RPC_URL ||
    "https://testnet-rpc.helachain.com"
  );
}

function readDeploymentAddresses(): DeploymentAddresses | null {
  for (const filePath of DEPLOYMENT_FILES) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as { contracts?: Record<string, string> };
      const contracts = parsed.contracts || {};

      if (contracts.agentRegistry || contracts.agentEscrow || contracts.agentExecutor) {
        return {
          agentRegistry: contracts.agentRegistry,
          agentEscrow: contracts.agentEscrow,
          agentExecutor: contracts.agentExecutor
        };
      }
    } catch {
      // Ignore invalid deployment files and continue.
    }
  }

  return null;
}

async function fetchAllAgentsWithRegistry(address: string) {
  const provider = new JsonRpcProvider(getRpcUrl());
  const registry = new Contract(address, AGENT_REGISTRY_ABI, provider);
  return (await registry.getAllAgents()) as Array<{
    id: bigint;
    name: string;
    description: string;
    agentType: string;
    priceHLUSD: bigint;
    developer: string;
    isActive: boolean;
    configSchema: string;
  }>;
}

async function fetchActivationCountWithEscrow(address: string, agentId: number) {
  const provider = new JsonRpcProvider(getRpcUrl());
  const escrow = new Contract(address, AGENT_ESCROW_ABI, provider);
  const count = (await escrow.getActivationCountForAgent(agentId)) as bigint;
  return Number(count);
}

function toPrice(priceWei: bigint): number {
  const parsed = Number(formatUnits(priceWei, 18));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Number(parsed.toFixed(6));
}

function isMarketplaceExcluded(agent: AgentListItem) {
  return MARKETPLACE_EXCLUDED_NAME_PATTERNS.some((pattern) => pattern.test(agent.name));
}

function getMarketplacePriority(agent: AgentListItem): number {
  const normalizedType = agent.agentType.trim().toLowerCase();
  const canonicalName = CANONICAL_AGENT_NAMES[normalizedType];

  if (canonicalName && agent.name.trim().toLowerCase() === canonicalName.toLowerCase()) {
    return 100;
  }

  return 10;
}

export async function GET() {
  try {
    let agents = [] as Awaited<ReturnType<typeof fetchAllAgents>>;
    let useFallback = false;

    try {
      agents = await fetchAllAgents();
      if (agents.length === 0) {
        useFallback = true;
      }
    } catch {
      useFallback = true;
    }

    const deploymentAddresses = useFallback ? readDeploymentAddresses() : null;
    if (useFallback && deploymentAddresses?.agentRegistry) {
      agents = (await fetchAllAgentsWithRegistry(deploymentAddresses.agentRegistry)) as typeof agents;
    }

    const storedAgents = await listStoredAgents().catch(() => []);
    const storedDeveloperByAgentId = new Map(
      storedAgents
        .filter((entry) => entry.developerAddress && entry.agentId)
        .map((entry) => [Number(entry.agentId), entry.developerAddress])
    );

    const activeCounts = await Promise.all(
      agents.map(async (agent) => {
        try {
          if (deploymentAddresses?.agentEscrow) {
            return await fetchActivationCountWithEscrow(deploymentAddresses.agentEscrow, Number(agent.id));
          }
          return await fetchAgentActivationCount(Number(agent.id));
        } catch {
          return 0;
        }
      })
    );

    const mappedAgents: AgentListItem[] = agents
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
        developer: storedDeveloperByAgentId.get(Number(agent.id)) || agent.developer
      }))
      .filter((agent) => !isHiddenAgentName(agent.name))
      .filter((agent) => !isMarketplaceExcluded(agent));
    const sortedAgents = [...mappedAgents].sort((left, right) => {
      const priorityDiff = getMarketplacePriority(right) - getMarketplacePriority(left);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (right.activeCount !== left.activeCount) {
        return right.activeCount - left.activeCount;
      }

      return left.id - right.id;
    });

    return NextResponse.json({ agents: sortedAgents }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch agents." }, { status: 500 });
  }
}
