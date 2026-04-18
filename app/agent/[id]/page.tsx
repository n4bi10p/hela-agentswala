"use client";

import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { connectWallet, ensureHeLaNetwork, getConnectedAccount } from "@/lib/wallet";
import { getAgentImage, parseConfigSchema } from "@/lib/agentUi";

const AGENTS: Record<
  string,
  {
    id: number;
    name: string;
    type: string;
    description: string;
    fullDescription: string;
    image: string;
    price: number;
    activeCount: number;
    isLive: boolean;
    config: { field: string; type: string; placeholder: string }[];
  }
> = {
  "1": {
    id: 1,
    name: "Trading Bot",
    type: "TRADING",
    description:
      "Monitors price thresholds and executes swaps across multiple liquidity pools with precision timing.",
    fullDescription:
      "The Trading Bot is an advanced autonomous agent that monitors price movements across multiple liquidity pools. It can execute swaps at optimal prices, set custom alerts, and simulate trade execution. Perfect for active traders and DeFi enthusiasts.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCP9WykVHXlBO4UR2yXu_3m-9IlbFZ2gQIcMEdQEFf9kGLNUq3OsUSKEd-VP82nlecVqwhbNq-gonLvflkS3USYdgiPjK3LnO14jyjCtsyoXoWhgddIoMD7l4mDOaljT05Z6K5HXw2-DtHyNQRWIr3YVhYzViY-zmT2_q0hdYaHqqVYeK02HmzB_BbVzpyU-W444Ddm1M8nXvvT5padIoGxZGyKmLtGHJA73rLAHpMHnKxe3z179wvZf3q8lJpEHjZkxmW_IL2iOFY",
    price: 2.5,
    activeCount: 24,
    isLive: true,
    config: [
      { field: "Token Pair", type: "text", placeholder: "e.g., HLUSD/ETH" },
      { field: "Price Threshold", type: "number", placeholder: "e.g., 0.98" },
      { field: "Current Price", type: "number", placeholder: "e.g., 0.95" },
      { field: "Action Type", type: "select", placeholder: "Alert or Execute" },
      { field: "Amount", type: "number", placeholder: "HLUSD amount" }
    ]
  },
  "2": {
    id: 2,
    name: "Yield Orchestrator",
    type: "FARMING",
    description:
      "Auto-compounds yield, monitors LP positions and suggests optimal farming strategies.",
    fullDescription:
      "Yield Orchestrator automatically compounds your LP yields and monitors position health. It provides real-time APY updates and recommends rebalancing actions based on market conditions.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsYXxIvzCasfwu0KjYNIBqyp1bFixdCnGRqahsrugyzKTdlpaGYJekeVsoCU80cL0ClsaNm1FUZV7OHNfe7ilj-_l2COB9BDtlqOfu0HEjItghJg8n2BazGMVB6NGd_jKE5p3iIUTBOuXIBCUcdRPsNbvuOncUKAoiw2vvz28Edhtyu7cNaMo24d13vtgrzJqATCd0DPQq1HH72HD6hjJ4vCZ6_nWMAJrgRtul6oDOhyJ9D95rrWRDMpXWM8gJgn5MwzQSljgigWY",
    price: 0.8,
    activeCount: 812,
    isLive: true,
    config: [
      { field: "LP Token Address", type: "text", placeholder: "0x..." },
      { field: "Current APY", type: "number", placeholder: "e.g., 12.5" },
      { field: "Threshold", type: "number", placeholder: "Min yield to compound %" }
    ]
  },
  "3": {
    id: 3,
    name: "Social Sentinel",
    type: "CONTENT",
    description:
      "Gemini-powered social media content auto-responder with tone customization.",
    fullDescription:
      "Social Sentinel uses Gemini AI to generate contextual replies to social media messages. Customize tone, brand voice, and response style. Get 3 reply options and pick your favorite.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdvfCf5x6E9xZ1AIosqHI4a2tE0JdCcz9eA6a0Mg1XVmXbiUf9tvBcRRdtvhuLii5lPeODU7FR5BT6cbAZZOH8IW5iM6UcR9es5YxQdlDcFnKhHDEhkzm25txi8bCgKRgLbhTJdgJ4ptuZK6HaIddvX8vLhaAL8LvsrsMB3dGgrVmUAgyYqRN9SDUWaz-CfvrK2r8-dBCa57ZYpspB8HEKiGrXhWrUoI3-LDWeMc8dOjvKSHsWXCLg8frA1SnBPO4ihdmXdOGczmY",
    price: 1.2,
    activeCount: 12,
    isLive: false,
    config: [
      { field: "Sample Message", type: "textarea", placeholder: "Paste a sample incoming message..." },
      { field: "Tone", type: "select", placeholder: "Professional/Casual/Aggressive" },
      { field: "Brand Context", type: "textarea", placeholder: "Describe your brand..." },
      { field: "Language", type: "select", placeholder: "English/Other" }
    ]
  },
  "4": {
    id: 4,
    name: "Arb Master Z",
    type: "TRADING",
    description: "Advanced arbitrage detection and execution across DEX pools.",
    fullDescription:
      "The most advanced arbitrage detection system on HeLa. Monitors multiple DEX pools simultaneously for profitable opportunities and executes trades with minimal slippage.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnv7KX2CUfHTtVNxA3N1yyGsjzDYkP_tVm03JkSp3rGuTJQF3OvgGDqR9hxevv8RomyvjQ6-OpASMXLDOTmas1e_LExvngr7iYa9-gZKbhMMtfxN2_QEUutB8pNwKVbqGnEG4pdiorgTct8ZPrxVV1m9RqZGcuRbQ1S9Pzs4Vnw9j5CXoVZVBXmQ5nwmxi5VxpPjwhUcoI6Il77MiHdn5XqHSFwI8z4rfxhVaUDWKbf80d-7E65rlm75sk4g5o6hL3I5FpuJ6K6X8",
    price: 4.2,
    activeCount: 56,
    isLive: true,
    config: [
      { field: "Min Profit Threshold %", type: "number", placeholder: "0.5" },
      { field: "DEX Whitelist", type: "text", placeholder: "Comma-separated DEX names" },
      { field: "Max Gas Price", type: "number", placeholder: "HLUSD" }
    ]
  },
  "5": {
    id: 5,
    name: "Schedule Master",
    type: "SCHEDULING",
    description:
      "Recurring HLUSD payments on customizable time-based triggers.",
    fullDescription:
      "Set up recurring HLUSD payments on a schedule of your choice. Perfect for subscriptions, recurring expenses, or automated payouts.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCP9WykVHXlBO4UR2yXu_3m-9IlbFZ2gQIcMEdQEFf9kGLNUq3OsUSKEd-VP82nlecVqwhbNq-gonLvflkS3USYdgiPjK3LnO14jyjCtsyoXoWhgddIoMD7l4mDOaljT05Z6K5HXw2-DtHyNQRWIr3YVhYzViY-zmT2_q0hdYaHqqVYeK02HmzB_BbVzpyU-W444Ddm1M8nXvvT5padIoGxZGyKmLtGHJA73rLAHpMHnKxe3z179wvZf3q8lJpEHjZkxmW_IL2iOFY",
    price: 0.5,
    activeCount: 234,
    isLive: true,
    config: [
      { field: "Recipient Address", type: "text", placeholder: "0x..." },
      { field: "Amount (HLUSD)", type: "number", placeholder: "100" },
      { field: "Frequency", type: "select", placeholder: "Daily/Weekly/Monthly" },
      { field: "Start Date", type: "date", placeholder: "YYYY-MM-DD" }
    ]
  },
  "6": {
    id: 6,
    name: "Portfolio Rebalancer",
    type: "REBALANCING",
    description:
      "Monitors wallet allocation drift and suggests rebalancing trades.",
    fullDescription:
      "Keep your portfolio allocation optimal. The Rebalancer monitors your tokens and alerts you when allocation drifts beyond your target percentages.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsYXxIvzCasfwu0KjYNIBqyp1bFixdCnGRqahsrugyzKTdlpaGYJekeVsoCU80cL0ClsaNm1FUZV7OHNfe7ilj-_l2COB9BDtlqOfu0HEjItghJg8n2BazGMVB6NGd_jKE5p3iIUTBOuXIBCUcdRPsNbvuOncUKAoiw2vvz28Edhtyu7cNaMo24d13vtgrzJqATCd0DPQq1HH72HD6hjJ4vCZ6_nWMAJrgRtul6oDOhyJ9D95rrWRDMpXWM8gJgn5MwzQSljgigWY",
    price: 1.8,
    activeCount: 89,
    isLive: true,
    config: [
      { field: "Target Allocation", type: "text", placeholder: "HLUSD:60%, ETH:30%, OTHER:10%" },
      { field: "Current Allocation", type: "text", placeholder: "Optional: HLUSD:55%, ETH:35%, OTHER:10%" },
      { field: "Drift Tolerance %", type: "number", placeholder: "5" },
      { field: "Tokens to Monitor", type: "text", placeholder: "HLUSD,ETH,BTC" }
    ]
  },
  "7": {
    id: 7,
    name: "Business Assistant",
    type: "BUSINESS",
    description: "Gemini AI answers queries, drafts emails, and summarizes documents.",
    fullDescription:
      "Your AI-powered business assistant powered by Gemini. Ask questions, draft emails, summarize documents, generate reports. Perfect for busy entrepreneurs.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnv7KX2CUfHTtVNxA3N1yyGsjzDYkP_tVm03JkSp3rGuTJQF3OvgGDqR9hxevv8RomyvjQ6-OpASMXLDOTmas1e_LExvngr7iYa9-gZKbhMMtfxN2_QEUutB8pNwKVbqGnEG4pdiorgTct8ZPrxVV1m9RqZGcuRbQ1S9Pzs4Vnw9j5CXoVZVBXmQ5nwmxi5VxpPjwhUcoI6Il77MiHdn5XqHSFwI8z4rfxhVaUDWKbf80d-7E65rlm75sk4g5o6hL3I5FpuJ6K6X8",
    price: 2.0,
    activeCount: 156,
    isLive: true,
    config: [
      { field: "Query", type: "textarea", placeholder: "Ask what support you need from the agent..." },
      { field: "Business Type", type: "text", placeholder: "e.g., SaaS, Agency, Retail" },
      { field: "Industry Context", type: "textarea", placeholder: "Describe your industry..." },
      { field: "Response Language", type: "select", placeholder: "English/Other" },
      { field: "Formality", type: "select", placeholder: "formal/informal" }
    ]
  }
};

const FIELD_SELECT_OPTIONS: Record<string, string[]> = {
  "Action Type": ["buy", "sell", "hold"],
  "Compound Frequency": ["daily", "weekly", "monthly"],
  Tone: ["professional", "casual", "aggressive"],
  Language: ["English", "Hindi", "Spanish"],
  Frequency: ["hourly", "daily", "weekly", "monthly"],
  "Response Language": ["English", "Hindi", "Spanish"],
  Formality: ["formal", "informal"]
};

const FAUCET_URL = "https://testnet-faucet.helachain.com/";

type AgentProfile = (typeof AGENTS)[string];
type AutomationFrequency = "hourly" | "daily" | "weekly" | "monthly";

type RemoteAgent = {
  id: number;
  name: string;
  description: string;
  type: string;
  agentType: string;
  price: number;
  activeCount: number;
  isLive: boolean;
  image: string;
  configSchema: string;
};

type AgentRouteResponse = {
  agent?: RemoteAgent;
  error?: string;
};

type CreatedJobResponse = {
  job: {
    id: string;
    frequency: AutomationFrequency;
    nextRunAt: string;
    status: string;
  };
  agentWalletAddress: string;
};

type AutomationAgentState = {
  automationReady: boolean;
  storedAgent: {
    agentId: string;
    agentWalletAddress: string;
    status: "active" | "paused";
    deployedAt: string;
  } | null;
};

type ActivationRequest = {
  endpoint: string;
  payload: Record<string, unknown>;
};

function toConfigFields(configSchema: string): AgentProfile["config"] {
  return parseConfigSchema(configSchema).map((field) => ({
    field: field.label,
    type: field.inputType,
    placeholder: field.placeholder
  }));
}

function toAgentProfile(remoteAgent: RemoteAgent): AgentProfile {
  const preset = AGENTS[String(remoteAgent.id)];
  const fallbackType = (remoteAgent.type || remoteAgent.agentType || "agent").toUpperCase();

  return {
    id: remoteAgent.id,
    name: remoteAgent.name,
    type: fallbackType,
    description: remoteAgent.description,
    fullDescription: preset?.fullDescription || remoteAgent.description,
    image:
      remoteAgent.image ||
      preset?.image ||
      getAgentImage(remoteAgent.agentType || remoteAgent.type || "trading"),
    price: remoteAgent.price,
    activeCount: remoteAgent.activeCount,
    isLive: remoteAgent.isLive,
    config: preset?.config || toConfigFields(remoteAgent.configSchema)
  };
}

function readField(formData: Record<string, string>, field: string): string {
  return (formData[field] || "").trim();
}

function parseRequiredNumber(formData: Record<string, string>, field: string): number {
  const raw = readField(formData, field);
  if (!raw) {
    throw new Error(`${field} is required.`);
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return parsed;
}

function parseAllocationMap(raw: string): Record<string, number> {
  const result: Record<string, number> = {};
  const parts = raw
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  for (const part of parts) {
    const [token, value] = part.split(":").map((segment) => segment.trim());
    if (!token || !value) {
      continue;
    }
    const numericValue = Number(value.replace("%", "").trim());
    if (Number.isFinite(numericValue)) {
      result[token] = numericValue;
    }
  }

  return result;
}

function deriveCurrentAllocations(targetAllocations: Record<string, number>): Record<string, number> {
  const entries = Object.entries(targetAllocations);
  if (entries.length < 2) {
    return { ...targetAllocations };
  }

  const current = { ...targetAllocations };
  const [firstToken, firstValue] = entries[0];
  const [secondToken, secondValue] = entries[1];
  const drift = Math.min(5, secondValue);
  current[firstToken] = Number((firstValue + drift).toFixed(2));
  current[secondToken] = Number((secondValue - drift).toFixed(2));
  return current;
}

function normalizeDateToIso(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Start Date must be a valid date.");
  }
  return parsed.toISOString();
}

function buildActivationRequest(agentId: string, formData: Record<string, string>): ActivationRequest {
  if (agentId === "1") {
    const thresholdPrice = parseRequiredNumber(formData, "Price Threshold");
    const amount = parseRequiredNumber(formData, "Amount");
    const currentPriceRaw = readField(formData, "Current Price");
    const currentPrice = currentPriceRaw ? Number(currentPriceRaw) : thresholdPrice;

    if (!Number.isFinite(currentPrice)) {
      throw new Error("Current Price must be a valid number.");
    }

    return {
      endpoint: "/api/agents/trading",
      payload: {
        tokenPair: readField(formData, "Token Pair") || "HLUSD/ETH",
        thresholdPrice,
        currentPrice,
        action: (readField(formData, "Action Type") || "buy").toLowerCase(),
        amount
      }
    };
  }

  if (agentId === "2") {
    const compoundThreshold = parseRequiredNumber(formData, "Threshold");
    const currentAPYRaw = readField(formData, "Current APY");
    const currentAPY = currentAPYRaw ? Number(currentAPYRaw) : compoundThreshold + 1;

    if (!Number.isFinite(currentAPY)) {
      throw new Error("Current APY must be a valid number.");
    }

    const lpAddress = readField(formData, "LP Token Address") || "0x0000000000000000000000000000000000000000";
    const riskLevel = currentAPY >= compoundThreshold + 10 ? "high" : currentAPY >= compoundThreshold ? "medium" : "low";

    return {
      endpoint: "/api/agents/farming",
      payload: {
        protocol: "yield-orchestrator",
        poolType: lpAddress,
        amount: compoundThreshold,
        durationDays: 30,
        riskLevel
      }
    };
  }

  if (agentId === "3") {
    return {
      endpoint: "/api/agents/content",
      payload: {
        message:
          readField(formData, "Sample Message") ||
          "Thanks for your message. Can we continue this conversation?",
        tone: (readField(formData, "Tone") || "professional").toLowerCase(),
        brandContext: readField(formData, "Brand Context") || "General brand context"
      }
    };
  }

  if (agentId === "4") {
    const thresholdPrice = parseRequiredNumber(formData, "Min Profit Threshold %");
    const amount = parseRequiredNumber(formData, "Max Gas Price");

    return {
      endpoint: "/api/agents/trading",
      payload: {
        tokenPair: readField(formData, "Token Pair") || "HLUSD/ETH",
        thresholdPrice,
        currentPrice: thresholdPrice,
        action: "buy",
        amount
      }
    };
  }

  if (agentId === "5") {
    const amount = parseRequiredNumber(formData, "Amount (HLUSD)");
    const frequencyRaw = readField(formData, "Frequency").toLowerCase();
    const frequency = ["hourly", "daily", "weekly", "monthly"].includes(frequencyRaw)
      ? frequencyRaw
      : "daily";

    return {
      endpoint: "/api/agents/scheduling",
      payload: {
        recipient: readField(formData, "Recipient Address"),
        amount,
        frequency,
        startDate: normalizeDateToIso(readField(formData, "Start Date"))
      }
    };
  }

  if (agentId === "6") {
    const targetRaw = readField(formData, "Target Allocation");
    const targetAllocations = parseAllocationMap(targetRaw);
    if (!Object.keys(targetAllocations).length) {
      throw new Error("Target Allocation must include at least one token:value pair.");
    }

    const currentRaw = readField(formData, "Current Allocation");
    const currentAllocations = Object.keys(parseAllocationMap(currentRaw)).length
      ? parseAllocationMap(currentRaw)
      : deriveCurrentAllocations(targetAllocations);

    return {
      endpoint: "/api/agents/rebalancing",
      payload: {
        targetAllocations,
        currentAllocations,
        driftTolerance: parseRequiredNumber(formData, "Drift Tolerance %")
      }
    };
  }

  if (agentId === "7") {
    const businessType = readField(formData, "Business Type") || "general";
    return {
      endpoint: "/api/agents/business",
      payload: {
        query:
          readField(formData, "Query") ||
          `Give three practical growth actions for a ${businessType} business.`,
        businessContext: readField(formData, "Industry Context") || businessType,
        language: readField(formData, "Response Language") || "English",
        formality: (readField(formData, "Formality") || "formal").toLowerCase()
      }
    };
  }

  const genericConfig = Object.entries(formData).reduce<Record<string, string>>((acc, [field, value]) => {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      acc[field] = trimmed;
    }
    return acc;
  }, {});

  if (!Object.keys(genericConfig).length) {
    throw new Error("Please provide configuration values before activating this agent.");
  }

  return {
    endpoint: "/api/agents/execute",
    payload: {
      agentId,
      userConfig: genericConfig
    }
  };
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const localAgent = AGENTS[agentId];

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [agentFromBackend, setAgentFromBackend] = useState<AgentProfile | null>(null);
  const [isAgentLoading, setIsAgentLoading] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);
  const [automationState, setAutomationState] = useState<AutomationAgentState | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [automationStatus, setAutomationStatus] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [automationFrequency, setAutomationFrequency] = useState<AutomationFrequency>("daily");
  const [createdJob, setCreatedJob] = useState<CreatedJobResponse | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAgent() {
      setIsAgentLoading(true);
      setAgentLoadError(null);

      try {
        const [agentResponse, automationResponse] = await Promise.all([
          fetch(`/api/agents/${agentId}`, {
            method: "GET",
            cache: "no-store"
          }),
          fetch(`/api/automation/agent/${agentId}`, {
            method: "GET",
            cache: "no-store"
          }).catch(() => null)
        ]);

        const agentData = (await agentResponse.json()) as AgentRouteResponse;
        if (!agentResponse.ok || !agentData.agent) {
          throw new Error(agentData.error || "Failed to load agent details.");
        }

        let nextAutomationState: AutomationAgentState | null = null;
        if (automationResponse) {
          const automationData = (await automationResponse.json()) as AutomationAgentState;
          if (automationResponse.ok) {
            nextAutomationState = automationData;
          }
        }

        if (active) {
          setAgentFromBackend(toAgentProfile(agentData.agent));
          setAutomationState(nextAutomationState);
          if (nextAutomationState?.storedAgent) {
            setCreatedJob((current) =>
              current || {
                job: {
                  id: "",
                  frequency: "daily",
                  nextRunAt: "",
                  status: nextAutomationState.storedAgent?.status || "active"
                },
                agentWalletAddress: nextAutomationState.storedAgent.agentWalletAddress
              }
            );
          }
        }
      } catch (error: unknown) {
        if (active) {
          setAgentFromBackend(null);
          setAgentLoadError(error instanceof Error ? error.message : "Failed to load agent details.");
        }
      } finally {
        if (active) {
          setIsAgentLoading(false);
        }
      }
    }

    void loadAgent();
    return () => {
      active = false;
    };
  }, [agentId]);

  const agent = useMemo(() => agentFromBackend || localAgent || null, [agentFromBackend, localAgent]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActivate = async () => {
    if (!agent) {
      return;
    }

    setActivationError(null);
    setActivationSuccess(null);
    setIsActivating(true);

    try {
      const { endpoint, payload } = buildActivationRequest(agentId, formData);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Activation request failed.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(`agent-config-${agentId}`, JSON.stringify(formData));
      }

      setActivationSuccess(`Agent ${agent.name} activated successfully.`);
    } catch (error: unknown) {
      setActivationError(error instanceof Error ? error.message : "Activation failed.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleCreateAutomation = async () => {
    try {
      setIsCreatingJob(true);
      setAutomationError(null);
      setAutomationStatus("Preparing automation job...");

      await ensureHeLaNetwork();
      const account = (await getConnectedAccount()) || (await connectWallet());

      const response = await fetch("/api/automation/jobs", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          agentId: String(agentId),
          ownerAddress: account,
          frequency: automationFrequency,
          nextRunAt: new Date().toISOString(),
          userConfig: formData
        })
      });

      const payload = (await response.json()) as CreatedJobResponse | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to create automation job.");
      }

      setCreatedJob(payload);
      setAutomationState((current) => ({
        automationReady: true,
        storedAgent: {
          agentId: String(agentId),
          agentWalletAddress: payload.agentWalletAddress,
          status: "active",
          deployedAt: current?.storedAgent?.deployedAt || new Date().toISOString()
        }
      }));
      setAutomationStatus("Automation job created. Fund the agent wallet so it can run on schedule.");
    } catch (error: unknown) {
      setAutomationError(error instanceof Error ? error.message : "Failed to create automation job.");
      setAutomationStatus(null);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleCopyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setAutomationStatus("Agent wallet address copied. Open the faucet and paste it there to fund the agent.");
    } catch {
      setAutomationError("Failed to copy wallet address.");
    }
  };

  if (!agent && isAgentLoading) {
    return (
      <main className="min-h-screen bg-black">
        <TopNavBar />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="text-center">
            <h1 className="mb-4 font-headline text-4xl text-white">LOADING AGENT</h1>
            <p className="font-mono text-xs uppercase text-white/60">Fetching live agent details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="min-h-screen bg-black">
        <TopNavBar />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="text-center">
            <h1 className="mb-4 font-headline text-4xl text-white">AGENT NOT FOUND</h1>
            {agentLoadError && (
              <p className="mb-4 font-mono text-xs uppercase text-red-300">{agentLoadError}</p>
            )}
            <Link href="/marketplace" className="text-white transition-colors hover:text-white/60">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const canCreateAutomation = Boolean(automationState?.automationReady);
  const displayWalletAddress =
    createdJob?.agentWalletAddress || automationState?.storedAgent?.agentWalletAddress || null;

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      <div className="mx-auto mt-24 grid max-w-7xl grid-cols-1 gap-8 p-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="h-96 w-full overflow-hidden border border-white/12 bg-surface-container-lowest">
            <img src={agent.image} alt={agent.name} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-col gap-4 border border-white/12 p-6">
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Active Users</p>
              <p className="font-headline text-4xl text-white">{agent.activeCount}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Price/Hour</p>
              <p className="font-headline text-4xl text-white">{agent.price} HLUSD</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Status</p>
              <div className={`mt-2 flex items-center gap-2 ${agent.isLive ? "text-live-signal" : "text-white/20"}`}>
                <span className={`h-3 w-3 rounded-full ${agent.isLive ? "bg-live-signal" : "bg-white/20"}`}></span>
                <span className="font-mono text-sm uppercase">{agent.isLive ? "LIVE" : "IDLE"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h1 className="mb-4 font-headline text-6xl uppercase text-white">{agent.name}</h1>
            <p className="text-sm uppercase leading-relaxed text-white/60">{agent.fullDescription}</p>
            {agentLoadError && (
              <div className="mt-4 border border-yellow-500/60 bg-yellow-500/10 p-3">
                <p className="font-mono text-xs uppercase text-yellow-100">
                  Using fallback details: {agentLoadError}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 border border-white/12 p-6">
            <h2 className="font-headline text-2xl uppercase text-white">Configuration</h2>

            <div className="flex flex-col gap-4">
              {agent.config.map((configItem, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <label className="font-mono text-xs uppercase text-white/60">{configItem.field}</label>
                  {configItem.type === "textarea" ? (
                    <textarea
                      placeholder={configItem.placeholder}
                      value={formData[configItem.field] || ""}
                      onChange={(event) => handleInputChange(configItem.field, event.target.value)}
                      className="border border-white/20 bg-surface-container p-3 font-mono text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
                      rows={3}
                    />
                  ) : configItem.type === "select" ? (
                    <select
                      value={formData[configItem.field] || ""}
                      onChange={(event) => handleInputChange(configItem.field, event.target.value)}
                      className="border border-white/20 bg-surface-container p-3 font-mono text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
                    >
                      <option value="">{configItem.placeholder}</option>
                      {(FIELD_SELECT_OPTIONS[configItem.field] || ["option1", "option2"]).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={configItem.type}
                      placeholder={configItem.placeholder}
                      value={formData[configItem.field] || ""}
                      onChange={(event) => handleInputChange(configItem.field, event.target.value)}
                      className="border border-white/20 bg-surface-container p-3 font-mono text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full border border-white bg-white py-4 font-headline text-xl uppercase text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50"
            >
              {isActivating ? "ACTIVATING..." : "[ ACTIVATE ↗ ]"}
            </button>

            {activationError && (
              <div className="border border-red-500/60 bg-red-500/10 p-3">
                <p className="font-mono text-xs uppercase text-red-200">{activationError}</p>
              </div>
            )}

            {activationSuccess && (
              <div className="border border-green-500/60 bg-green-500/10 p-3">
                <p className="font-mono text-xs uppercase text-green-200">{activationSuccess}</p>
              </div>
            )}

            {(agent.type === "CONTENT" || agent.type === "BUSINESS") && (
              <Link
                href={`/agent/${agentId}/run`}
                className="w-full border border-white py-4 text-center font-headline text-xl uppercase text-white transition-colors hover:bg-white hover:text-black"
              >
                [ OPEN INTERACTION ↗ ]
              </Link>
            )}

            <div className="border border-white/12 p-4">
              <h3 className="font-headline text-xl uppercase text-white">Automation</h3>
              <p className="mt-2 font-mono text-xs uppercase text-white/60">
                Create a recurring job for this agent. Scheduling agents need HLUSD funded into the agent wallet.
              </p>

              {!canCreateAutomation && (
                <div className="mt-4 border border-yellow-500/60 bg-yellow-500/10 p-3">
                  <p className="font-mono text-xs uppercase text-yellow-100">
                    Automation is only available for agents deployed through the new AI runtime pipeline. Older registry-only agents can still be activated, but not automated.
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3">
                <label className="font-mono text-xs uppercase text-white/60">Run Frequency</label>
                <select
                  value={automationFrequency}
                  onChange={(event) => setAutomationFrequency(event.target.value as AutomationFrequency)}
                  className="border border-white/20 bg-surface-container p-3 font-mono text-sm text-white focus:border-white focus:outline-none"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <button
                onClick={handleCreateAutomation}
                disabled={!canCreateAutomation || isCreatingJob}
                className="mt-4 w-full border border-white bg-white py-4 font-headline text-xl uppercase text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingJob ? "CREATING..." : "[ CREATE AUTOMATION ↗ ]"}
              </button>

              {automationError && (
                <div className="mt-4 border border-red-500/60 bg-red-500/10 p-3">
                  <p className="font-mono text-xs uppercase text-red-200">{automationError}</p>
                </div>
              )}

              {automationStatus && (
                <div className="mt-4 border border-white/12 bg-white/5 p-3">
                  <p className="font-mono text-xs uppercase text-white/80">{automationStatus}</p>
                </div>
              )}

              {displayWalletAddress && (
                <div className="mt-4 border border-live-signal/30 bg-live-signal/5 p-4">
                  <p className="font-mono text-xs uppercase text-white/60">Agent Wallet Address</p>
                  <p className="mt-2 break-all font-mono text-xs text-white">{displayWalletAddress}</p>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
                    <button
                      onClick={() => handleCopyWalletAddress(displayWalletAddress)}
                      className="border border-white px-4 py-3 font-headline text-sm uppercase text-white transition-colors hover:bg-white hover:text-black"
                    >
                      [ COPY WALLET ADDRESS ]
                    </button>
                    <a
                      href={FAUCET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white bg-white px-4 py-3 text-center font-headline text-sm uppercase text-black transition-colors hover:bg-black hover:text-white"
                    >
                      [ OPEN HLUSD FAUCET ↗ ]
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/marketplace"
              className="w-full border border-white py-4 text-center font-headline text-xl uppercase text-white transition-colors hover:bg-white hover:text-black"
            >
              [ BACK ↗ ]
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
