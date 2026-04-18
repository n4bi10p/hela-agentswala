import { BrowserProvider, Contract, JsonRpcProvider, parseUnits } from "ethers";

export type AgentType =
  | "trading"
  | "farming"
  | "scheduling"
  | "rebalancing"
  | "content"
  | "business";

export type AgentStruct = {
  id: bigint;
  name: string;
  description: string;
  agentType: string;
  priceHLUSD: bigint;
  developer: string;
  isActive: boolean;
  configSchema: string;
};

declare global {
  interface Window {
    ethereum?: {
      request: (payload: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

const AGENT_REGISTRY_ABI = [
  "function publishAgent(string name,string description,string agentType,uint256 priceHLUSD,string configSchema) returns (uint256)",
  "function getAgent(uint256 id) view returns ((uint256 id,string name,string description,string agentType,uint256 priceHLUSD,address developer,bool isActive,string configSchema))",
  "function getAllAgents() view returns ((uint256 id,string name,string description,string agentType,uint256 priceHLUSD,address developer,bool isActive,string configSchema)[])",
  "function setAgentActive(uint256 id, bool active)"
];

const AGENT_ESCROW_ABI = [
  "function activateAgent(uint256 agentId, string userConfig)",
  "function userActiveAgents(address user, uint256 index) view returns (uint256)",
  "event AgentActivated(uint256 indexed agentId, address indexed buyer, string config, uint256 timestamp)"
];

const AGENT_EXECUTOR_ABI = [
  "function logExecution(uint256 agentId, address user, string action, string result)",
  "event ExecutionLogged(uint256 indexed agentId, address indexed user, string action, string result, uint256 timestamp)"
];

const getRpcUrl = () => process.env.NEXT_PUBLIC_HELA_RPC || "https://testnet-rpc.helachain.com";

const getAddresses = () => {
  const registry = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  const escrow = process.env.NEXT_PUBLIC_AGENT_ESCROW_ADDRESS;
  const executor = process.env.NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS;

  if (!registry || !escrow || !executor) {
    throw new Error("Missing NEXT_PUBLIC contract addresses in env");
  }

  return { registry, escrow, executor };
};

export const getReadProvider = () => new JsonRpcProvider(getRpcUrl());

export async function getSignerProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet provider not found");
  }
  const provider = new BrowserProvider(window.ethereum as never);
  await provider.send("eth_requestAccounts", []);
  return provider;
}

export async function getRegistryContract(write = false) {
  const { registry } = getAddresses();
  if (!write) {
    return new Contract(registry, AGENT_REGISTRY_ABI, getReadProvider());
  }
  const provider = await getSignerProvider();
  return new Contract(registry, AGENT_REGISTRY_ABI, await provider.getSigner());
}

export async function getEscrowContract(write = false) {
  const { escrow } = getAddresses();
  if (!write) {
    return new Contract(escrow, AGENT_ESCROW_ABI, getReadProvider());
  }
  const provider = await getSignerProvider();
  return new Contract(escrow, AGENT_ESCROW_ABI, await provider.getSigner());
}

export async function getExecutorContract(write = false) {
  const { executor } = getAddresses();
  if (!write) {
    return new Contract(executor, AGENT_EXECUTOR_ABI, getReadProvider());
  }
  const provider = await getSignerProvider();
  return new Contract(executor, AGENT_EXECUTOR_ABI, await provider.getSigner());
}

export async function publishAgent(input: {
  name: string;
  description: string;
  agentType: AgentType;
  price: string;
  configSchema: string;
}) {
  const registry = await getRegistryContract(true);
  const tx = await registry.publishAgent(
    input.name,
    input.description,
    input.agentType,
    parseUnits(input.price, 18),
    input.configSchema
  );
  return tx.wait();
}

export async function activateAgent(agentId: number, userConfig: string) {
  const escrow = await getEscrowContract(true);
  const tx = await escrow.activateAgent(agentId, userConfig);
  return tx.wait();
}

export async function fetchAllAgents(): Promise<AgentStruct[]> {
  const registry = await getRegistryContract(false);
  return registry.getAllAgents();
}

export async function logExecution(agentId: number, user: string, action: string, result: string) {
  const executor = await getExecutorContract(true);
  const tx = await executor.logExecution(agentId, user, action, result);
  return tx.wait();
}
