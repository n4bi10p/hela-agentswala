"use client";

import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { useState } from "react";
import { BrowserProvider } from "ethers";
import type { AgentObject } from "@/types/agent";
import { connectWallet, ensureHeLaNetwork } from "@/lib/wallet";

const AGENT_TYPES = [
  "TRADING",
  "FARMING",
  "SCHEDULING",
  "REBALANCING",
  "CONTENT",
  "BUSINESS",
];

type GenerateRouteResponse = {
  agent?: AgentObject;
  executionCode?: string;
  ready?: boolean;
  error?: string;
};

type DeployRouteResponse = {
  agentId?: string;
  txHash?: string;
  explorerUrl?: string;
  marketplaceUrl?: string;
  deployed?: boolean;
  error?: string;
  details?: string;
};

type PublishStage = "idle" | "generating" | "signing" | "deploying";

function normalizeAgentType(value: string): AgentObject["agentType"] {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "trading" ||
    normalized === "farming" ||
    normalized === "scheduling" ||
    normalized === "rebalancing" ||
    normalized === "content"
  ) {
    return normalized;
  }
  return "business";
}

export default function PublishPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agentType: "",
    price: "",
    configSchema: "",
  });

  const [publishStage, setPublishStage] = useState<PublishStage>("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<DeployRouteResponse | null>(null);

  const isPublishing = publishStage !== "idle";

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePublish = async () => {
    // Validate form
    if (
      !formData.name ||
      !formData.description ||
      !formData.agentType ||
      !formData.price
    ) {
      setPublishError("Please fill in all required fields.");
      return;
    }

    try {
      setPublishError(null);
      setPublishResult(null);

      setPublishStage("generating");
      const prompt = [
        `Create an AI agent for marketplace publishing.`,
        `Agent name: ${formData.name.trim()}`,
        `Description: ${formData.description.trim()}`,
        `Preferred type: ${formData.agentType.trim().toLowerCase()}`,
        `Target price in HLUSD: ${formData.price.trim()}`,
        formData.configSchema.trim()
          ? `Configuration schema hints: ${formData.configSchema.trim()}`
          : "Configuration schema hints: include practical buyer input fields."
      ].join("\n");

      const generateResponse = await fetch("/api/agents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const generateData = (await generateResponse.json()) as GenerateRouteResponse;
      if (!generateResponse.ok || !generateData.agent || !generateData.executionCode) {
        throw new Error(generateData.error || "Failed to generate deployable agent payload.");
      }

      const normalizedPrice = Number(formData.price);
      const agentToDeploy: AgentObject = {
        ...generateData.agent,
        name: formData.name.trim(),
        description: formData.description.trim(),
        agentType: normalizeAgentType(formData.agentType),
        priceHLUSD: Number.isFinite(normalizedPrice) && normalizedPrice > 0
          ? normalizedPrice
          : generateData.agent.priceHLUSD,
      };

      setPublishStage("signing");
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask wallet not found. Please install or unlock MetaMask.");
      }

      const walletAddress = await connectWallet();
      await ensureHeLaNetwork();

      const provider = new BrowserProvider(window.ethereum as never);
      const signer = await provider.getSigner();
      const developerAddress = (await signer.getAddress()) || walletAddress;
      const signature = await signer.signMessage(`Deploy agent: ${agentToDeploy.name}`);

      setPublishStage("deploying");
      const deployResponse = await fetch("/api/agents/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent: agentToDeploy,
          executionCode: generateData.executionCode,
          developerAddress,
          signature,
        }),
      });

      const deployData = (await deployResponse.json()) as DeployRouteResponse;
      if (!deployResponse.ok || !deployData.deployed) {
        throw new Error(deployData.error || deployData.details || "Deployment failed.");
      }

      setPublishResult(deployData);
      setFormData({
        name: "",
        description: "",
        agentType: "",
        price: "",
        configSchema: "",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Publishing failed.";
      setPublishError(message);
    } finally {
      setPublishStage("idle");
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* Page Header */}
      <header className="px-8 pt-16 pb-8 border-b border-white/10 mt-24">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-sm text-white bracket-link cursor-pointer">
            PUBLISH
          </span>
          <span className="font-mono text-sm text-white/20 select-none">
            ░░░░░░░░░░░░░░
          </span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">
          PUBLISH
        </h1>
      </header>

      <div className="p-8 max-w-2xl mx-auto py-16">
        <div className="border border-white/12 p-8 flex flex-col gap-8">
          <div>
            <h2 className="font-headline text-4xl text-white mb-2 uppercase">
              Publish Your Agent
            </h2>
            <p className="text-white/60 text-sm leading-relaxed uppercase">
              Submit your AI agent to the Trovia marketplace. Fill in the
              details below and your agent will be reviewed and deployed on HeLa
              Chain.
            </p>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-6">
            {/* Agent Name */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-white/60 uppercase">
                Agent Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Advanced Trading Bot"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-surface-container border border-white/20 text-white placeholder-white/30 p-3 font-body text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-white/60 uppercase">
                Description *
              </label>
              <textarea
                placeholder="Describe what your agent does, its features, and benefits..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="bg-surface-container border border-white/20 text-white placeholder-white/30 p-3 font-body text-sm focus:outline-none focus:border-white transition-colors"
                rows={4}
              />
            </div>

            {/* Agent Type */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-white/60 uppercase">
                Agent Type *
              </label>
              <select
                value={formData.agentType}
                onChange={(e) => handleInputChange("agentType", e.target.value)}
                className="bg-surface-container border border-white/20 text-white placeholder-white/30 p-3 font-body text-sm focus:outline-none focus:border-white transition-colors"
              >
                <option value="">Select an agent type</option>
                {AGENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-white/60 uppercase">
                Price (HLUSD/Hour) *
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="bg-surface-container border border-white/20 text-white placeholder-white/30 p-3 font-body text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Config Schema */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-white/60 uppercase">
                Configuration Schema (JSON)
              </label>
              <textarea
                placeholder='[{"field": "paramName", "type": "text", "placeholder": "description"}]'
                value={formData.configSchema}
                onChange={(e) =>
                  handleInputChange("configSchema", e.target.value)
                }
                className="bg-surface-container border border-white/20 text-white placeholder-white/30 p-3 font-mono text-xs focus:outline-none focus:border-white transition-colors"
                rows={6}
              />
            </div>

            {/* Info Box */}
            <div className="bg-white/5 border border-white/10 p-4 flex flex-col gap-2">
              <p className="font-mono text-xs text-white/60 uppercase font-bold">
                Requirements
              </p>
              <ul className="text-white/60 text-xs leading-relaxed space-y-1 font-body uppercase">
                <li>✓ Connected wallet on HeLa Chain</li>
                <li>✓ Agent implementation deployed on HeLa</li>
                <li>✓ Configuration schema defines buyer inputs</li>
                <li>✓ Clear description of agent functionality</li>
                <li>✓ Agreed to marketplace terms</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 bg-white text-black py-4 font-headline text-xl hover:bg-black hover:text-white border border-white transition-colors disabled:opacity-50 uppercase"
            >
              {publishStage === "generating"
                ? "GENERATING..."
                : publishStage === "signing"
                  ? "SIGNING..."
                  : publishStage === "deploying"
                    ? "DEPLOYING..."
                    : "[ PUBLISH ↗ ]"}
            </button>

            <Link
              href="/marketplace"
              className="flex-1 border border-white text-white py-4 font-headline text-xl hover:bg-white hover:text-black transition-colors text-center uppercase"
            >
              [ BACK ↗ ]
            </Link>
          </div>

          {publishError && (
            <div className="border border-red-500/60 bg-red-500/10 p-4">
              <p className="font-mono text-xs text-red-200 uppercase">{publishError}</p>
            </div>
          )}

          {publishResult?.deployed && (
            <div className="border border-white/20 bg-white/5 p-4 flex flex-col gap-2">
              <p className="font-mono text-xs text-white/70 uppercase">Deployment Successful</p>
              <p className="font-body text-sm text-white">Agent ID: {publishResult.agentId}</p>
              <p className="font-body text-sm text-white break-all">Tx: {publishResult.txHash}</p>
              {publishResult.explorerUrl && (
                <a
                  href={publishResult.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-white/70 hover:text-white uppercase"
                >
                  [ VIEW ON EXPLORER ↗ ]
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
