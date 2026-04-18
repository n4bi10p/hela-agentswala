/**
 * Shared type contracts for generated agents, deployment snapshots, and execution results.
 * All backend routes and runners should import from this file to keep payload shapes consistent.
 */

export interface AgentField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "address";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface AgentObject {
  name: string;
  description: string;
  agentType: "trading" | "farming" | "scheduling" | "rebalancing" | "content" | "business";
  priceHLUSD: number;
  configSchema: { fields: AgentField[] };
  executionLogic: string;
  geminiPrompt: string;
  tags: string[];
  estimatedRuntime: string;
}

export interface StoredAgent {
  agent: AgentObject;
  executionCode: string;
  deployedAt: string;
  developerAddress: string;
  agentId: string;
}

export interface ExecutionResult {
  success: boolean;
  result: string;
  data?: Record<string, any>;
  txHash?: string;
  executedAt: string;
}
