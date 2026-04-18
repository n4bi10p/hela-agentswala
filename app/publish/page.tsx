"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import { publishAgent, type AgentType } from "@/lib/contracts";
import { connectWallet, ensureHeLaNetwork, persistConnectedAccount } from "@/lib/wallet";

const AGENT_TYPES = ["trading", "farming", "scheduling", "rebalancing", "content", "business"] as const;

type PublishReviewResult = {
  verdict: "approve" | "review" | "block";
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  findings: Array<{
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    detail: string;
  }>;
  recommendedChanges: string[];
  userSafetyNotes: string[];
  source: "heuristic" | "gemini" | "gemini+heuristic";
};

function defaultSchemaFor(agentType: string) {
  if (agentType === "scheduling") {
    return JSON.stringify(
      [
        { key: "recipient", type: "text", placeholder: "0x..." },
        { key: "amount", type: "number", placeholder: "100" },
        { key: "frequency", type: "select", options: ["daily", "weekly", "monthly"] }
      ],
      null,
      2
    );
  }

  return JSON.stringify({ notes: "text" }, null, 2);
}

export default function PublishPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agentType: "trading",
    price: "",
    configSchema: defaultSchemaFor("trading"),
    workflowSummary: ""
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<PublishReviewResult | null>(null);

  const explorerBase = useMemo(
    () => (process.env.NEXT_PUBLIC_HELA_RPC ? "https://testnet-blockexplorer.helachain.com/tx/" : null),
    []
  );

  const handleInputChange = (field: string, value: string) => {
    setReviewResult(null);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "agentType" && !prev.configSchema.trim() ? { configSchema: defaultSchemaFor(value) } : {})
    }));
  };

  const runSafetyReview = async () => {
    try {
      if (!formData.name || !formData.description || !formData.price || !formData.workflowSummary.trim()) {
        setError("Fill all publish fields and add a workflow summary before running the safety review.");
        return;
      }

      JSON.parse(formData.configSchema);

      setIsReviewing(true);
      setError(null);
      setStatusMessage("Running Gemini safety review...");

      const response = await fetch("/api/agents/review", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          agentType: formData.agentType,
          price: formData.price,
          configSchema: formData.configSchema,
          workflowSummary: formData.workflowSummary
        })
      });

      const payload = (await response.json()) as PublishReviewResult | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Safety review failed.");
      }

      setReviewResult(payload);
      setStatusMessage(
        payload.verdict === "approve"
          ? "Safety review passed. Publishing is enabled."
          : payload.verdict === "review"
            ? "Safety review requires fixes before publishing."
            : "Safety review blocked this submission."
      );
    } catch (reviewError) {
      if (reviewError instanceof SyntaxError) {
        setError("Configuration schema must be valid JSON.");
      } else {
        setError(reviewError instanceof Error ? reviewError.message : "Safety review failed.");
      }
      setStatusMessage(null);
      setReviewResult(null);
    } finally {
      setIsReviewing(false);
    }
  };

  const handlePublish = async () => {
    try {
      if (!formData.name || !formData.description || !formData.price || !formData.workflowSummary.trim()) {
        setError("Please fill in all required fields.");
        return;
      }

      JSON.parse(formData.configSchema);

      if (!reviewResult || reviewResult.verdict !== "approve") {
        setError("Run the AI safety review and resolve any issues before publishing.");
        return;
      }

      setIsPublishing(true);
      setError(null);
      setLastTxHash(null);
      setStatusMessage("Connecting wallet...");

      await ensureHeLaNetwork();
      const connectedAccount = await connectWallet();
      persistConnectedAccount(connectedAccount);

      setStatusMessage("Submitting publish transaction...");
      const txResult = await publishAgent({
        name: formData.name.trim(),
        description: formData.description.trim(),
        agentType: formData.agentType as AgentType,
        price: formData.price,
        configSchema: formData.configSchema
      });

      setLastTxHash(txResult.hash);
      setStatusMessage("Agent published on-chain.");
      setFormData({
        name: "",
        description: "",
        agentType: "trading",
        price: "",
        configSchema: defaultSchemaFor("trading"),
        workflowSummary: ""
      });
      setReviewResult(null);
    } catch (publishError) {
      if (publishError instanceof SyntaxError) {
        setError("Configuration schema must be valid JSON.");
      } else {
        setError(publishError instanceof Error ? publishError.message : "Failed to publish agent.");
      }
      setStatusMessage(null);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      <header className="mt-24 border-b border-white/10 px-8 pb-8 pt-16">
        <div className="mb-4 flex items-center gap-4">
          <span className="bracket-link cursor-pointer font-mono text-sm text-white">PUBLISH</span>
          <span className="select-none font-mono text-sm text-white/20">░░░░░░░░░░░░░░</span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">PUBLISH</h1>
      </header>

      <div className="mx-auto max-w-2xl p-8 py-16">
        <div className="flex flex-col gap-8 border border-white/12 p-8">
          <div>
            <h2 className="mb-2 font-headline text-4xl uppercase text-white">Publish Your Agent</h2>
            <p className="text-sm uppercase leading-relaxed text-white/60">
              Register a new agent directly on HeLa using your connected developer wallet.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase text-white/60">Agent Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                placeholder="e.g., Advanced Trading Bot"
                className="bg-surface-container border border-white/20 p-3 font-body text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase text-white/60">Description *</label>
              <textarea
                value={formData.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                placeholder="Describe what your agent does..."
                className="bg-surface-container border border-white/20 p-3 font-body text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase text-white/60">Agent Type *</label>
              <select
                value={formData.agentType}
                onChange={(event) => handleInputChange("agentType", event.target.value)}
                className="bg-surface-container border border-white/20 p-3 font-body text-sm uppercase text-white transition-colors focus:border-white focus:outline-none"
              >
                {AGENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase text-white/60">Activation Price (HLUSD) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.price}
                onChange={(event) => handleInputChange("price", event.target.value)}
                placeholder="e.g., 2.5"
                className="bg-surface-container border border-white/20 p-3 font-body text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase text-white/60">Configuration Schema (JSON)</label>
              <textarea
                value={formData.configSchema}
                onChange={(event) => handleInputChange("configSchema", event.target.value)}
                className="bg-surface-container border border-white/20 p-3 font-mono text-xs text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
                rows={8}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase text-white/60">Workflow & Contract Behavior Summary *</label>
              <textarea
                value={formData.workflowSummary}
                onChange={(event) => handleInputChange("workflowSummary", event.target.value)}
                placeholder="Explain exactly what the agent does, what permissions it asks for, and how it handles user funds."
                className="bg-surface-container border border-white/20 p-3 font-body text-sm text-white placeholder-white/30 transition-colors focus:border-white focus:outline-none"
                rows={5}
              />
            </div>

            <div className="border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-xs font-bold uppercase text-white/60">Requirements</p>
              <p className="mt-2 text-xs uppercase leading-relaxed text-white/60">
                Wallet on HeLa, valid config schema JSON, clear workflow disclosure, and a passed AI safety review before on-chain publishing.
              </p>
            </div>

            <div className="border border-white/12 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-headline text-2xl uppercase text-white">Safety Review</p>
                  <p className="mt-1 font-mono text-xs uppercase text-white/60">
                    Gemini screens new listings for wallet-draining, unethical, or illegal behavior.
                  </p>
                </div>
                <button
                  onClick={runSafetyReview}
                  disabled={isReviewing || isPublishing}
                  className="border border-white px-6 py-3 font-headline text-lg uppercase text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
                >
                  {isReviewing ? "REVIEWING..." : "[ RUN SAFETY REVIEW ↗ ]"}
                </button>
              </div>

              {reviewResult && (
                <div className="mt-6 flex flex-col gap-4 border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="font-headline text-xl uppercase text-white">
                      Verdict: {reviewResult.verdict.toUpperCase()}
                    </p>
                    <p className="font-mono text-xs uppercase text-white/60">
                      Risk: {reviewResult.riskLevel.toUpperCase()} | Source: {reviewResult.source.toUpperCase()}
                    </p>
                  </div>

                  <p className="font-body text-sm text-white/80">{reviewResult.summary}</p>

                  {reviewResult.findings.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <p className="font-mono text-xs uppercase text-white/50">Findings</p>
                      {reviewResult.findings.map((finding, index) => (
                        <div key={`${finding.title}-${index}`} className="border border-white/10 p-3">
                          <p className="font-headline text-lg uppercase text-white">
                            {finding.severity.toUpperCase()} | {finding.title}
                          </p>
                          <p className="mt-1 text-sm text-white/70">{finding.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {reviewResult.recommendedChanges.length > 0 && (
                    <div>
                      <p className="font-mono text-xs uppercase text-white/50">Recommended Changes</p>
                      <ul className="mt-2 space-y-2 text-sm text-white/70">
                        {reviewResult.recommendedChanges.map((change) => (
                          <li key={change}>- {change}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewResult.userSafetyNotes.length > 0 && (
                    <div>
                      <p className="font-mono text-xs uppercase text-white/50">Safety Notes</p>
                      <ul className="mt-2 space-y-2 text-sm text-white/70">
                        {reviewResult.userSafetyNotes.map((note) => (
                          <li key={note}>- {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {statusMessage && <p className="font-mono text-xs uppercase text-white/50">{statusMessage}</p>}
            {error && <p className="font-mono text-xs uppercase text-red-400">{error}</p>}
            {lastTxHash && (
              <p className="font-mono text-xs uppercase text-white/60">
                Tx Hash:{" "}
                {explorerBase ? (
                  <a href={`${explorerBase}${lastTxHash}`} target="_blank" rel="noreferrer" className="text-white">
                    {lastTxHash}
                  </a>
                ) : (
                  lastTxHash
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <button
              onClick={handlePublish}
              disabled={isPublishing || isReviewing || reviewResult?.verdict !== "approve"}
              className="flex-1 border border-white bg-white py-4 font-headline text-xl uppercase text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50"
            >
              {isPublishing ? "PUBLISHING..." : "[ PUBLISH ↗ ]"}
            </button>

            <Link
              href="/marketplace"
              className="flex-1 border border-white py-4 text-center font-headline text-xl uppercase text-white transition-colors hover:bg-white hover:text-black"
            >
              [ BACK ↗ ]
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
