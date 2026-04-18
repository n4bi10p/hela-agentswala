"use client";

import Link from "next/link";
import { formatUnits } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import {
  fetchActivationEventsForUser,
  fetchAgentById,
  fetchExecutionEventsForUser,
  fetchUserActiveAgentIds,
  type ActivationEventRecord,
  type AgentStruct,
  type ExecutionEventRecord
} from "@/lib/contracts";
import { getConnectedAccount } from "@/lib/wallet";
import { toAgentTypeLabel } from "@/lib/agentUi";

type DashboardAgent = AgentStruct & {
  numericId: number;
};

type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  timestamp: number;
  details: string;
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

function safeShortJson(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" | ");
  } catch {
    return raw;
  }
}

export default function DashboardPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [agents, setAgents] = useState<DashboardAgent[]>([]);
  const [activationEvents, setActivationEvents] = useState<ActivationEventRecord[]>([]);
  const [executionEvents, setExecutionEvents] = useState<ExecutionEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);

        const current = await getConnectedAccount();
        if (cancelled) {
          return;
        }

        setAccount(current);
        if (!current) {
          setAgents([]);
          setActivationEvents([]);
          setExecutionEvents([]);
          return;
        }

        const [activeIds, activations, executions] = await Promise.all([
          fetchUserActiveAgentIds(current),
          fetchActivationEventsForUser(current).catch(() => []),
          fetchExecutionEventsForUser(current).catch(() => [])
        ]);

        const uniqueIds = Array.from(new Set(activeIds));
        const agentRecords = await Promise.all(
          uniqueIds.map(async (id) => {
            const record = await fetchAgentById(id);
            return { ...record, numericId: id };
          })
        );

        if (cancelled) {
          return;
        }

        setAgents(agentRecords);
        setActivationEvents(activations);
        setExecutionEvents(executions);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    const handleWalletChanged = () => {
      loadDashboard().catch(() => undefined);
    };

    window.addEventListener("trovia:wallet-changed", handleWalletChanged as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("trovia:wallet-changed", handleWalletChanged as EventListener);
    };
  }, []);

  const feedItems = useMemo(() => {
    const activationItems: FeedItem[] = activationEvents.map((event) => ({
      id: `activation-${event.activationId}`,
      title: `Agent ${event.agentId} activated`,
      subtitle: "Activation recorded on-chain",
      timestamp: event.timestamp,
      details: `${Number(formatUnits(event.paidAmount, 18))} HLUSD | ${safeShortJson(event.config)}`
    }));

    const executionItems: FeedItem[] = executionEvents.map((event) => ({
      id: `execution-${event.txHash}`,
      title: `Agent ${event.agentId} executed`,
      subtitle: event.action,
      timestamp: event.timestamp,
      details: event.result
    }));

    return [...activationItems, ...executionItems].sort((left, right) => right.timestamp - left.timestamp);
  }, [activationEvents, executionEvents]);

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      <header className="mt-24 border-b border-white/10 px-8 pb-8 pt-16">
        <div className="mb-4 flex items-center gap-4">
          <span className="bracket-link cursor-pointer font-mono text-sm text-white">DASHBOARD</span>
          <span className="select-none font-mono text-sm text-white/20">░░░░░░░░░░░░░░</span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">AGENTS</h1>
      </header>

      <div className="mx-auto max-w-7xl p-8">
        {account && (
          <p className="mb-8 font-mono text-xs uppercase text-white/40">
            Connected Wallet: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <p className="font-mono text-sm uppercase text-white/60">Loading on-chain dashboard...</p>
          </div>
        ) : !account ? (
          <div className="border border-white/12 p-10 text-center">
            <h2 className="font-headline text-4xl uppercase text-white">Connect Wallet</h2>
            <p className="mt-4 font-mono text-xs uppercase text-white/60">
              Connect your MetaMask wallet from the top bar to load your active agents.
            </p>
          </div>
        ) : error ? (
          <div className="border border-red-500/40 bg-red-500/5 p-6">
            <p className="font-headline text-2xl uppercase text-white">Dashboard unavailable</p>
            <p className="mt-2 font-mono text-xs text-white/60">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-2 border border-white/12 p-6">
                <p className="font-mono text-xs uppercase text-white/60">Active Agents</p>
                <p className="font-headline text-6xl text-white">{agents.length}</p>
              </div>
              <div className="flex flex-col gap-2 border border-white/12 p-6">
                <p className="font-mono text-xs uppercase text-white/60">Activations</p>
                <p className="font-headline text-6xl text-white">{activationEvents.length}</p>
              </div>
              <div className="flex flex-col gap-2 border border-white/12 p-6">
                <p className="font-mono text-xs uppercase text-white/60">Execution Logs</p>
                <p className="font-headline text-6xl text-white">{executionEvents.length}</p>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="mb-6 font-headline text-4xl uppercase text-white">Your Active Agents</h2>

              {agents.length === 0 ? (
                <div className="border border-white/12 p-8">
                  <p className="font-mono text-xs uppercase text-white/60">
                    No active agents found for this wallet yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.numericId} className="border border-white/12 p-6 transition-colors hover:border-white">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="font-headline text-2xl uppercase text-white">{agent.name}</h3>
                          <p className="font-mono text-xs text-white/60">{toAgentTypeLabel(agent.agentType)}</p>
                        </div>
                        <div className={`flex items-center gap-2 font-mono text-xs ${agent.isActive ? "text-live-signal" : "text-white/20"}`}>
                          <span className={`h-2 w-2 rounded-full ${agent.isActive ? "bg-live-signal" : "bg-white/20"}`}></span>
                          {agent.isActive ? "ACTIVE" : "PAUSED"}
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <p className="font-mono text-xs uppercase text-white/60">Price</p>
                          <p className="font-mono text-sm text-white">{Number(formatUnits(agent.priceHLUSD, 18))} HLUSD</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs uppercase text-white/60">Agent Id</p>
                          <p className="font-mono text-sm text-white">{agent.numericId}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs uppercase text-white/60">Developer</p>
                          <p className="font-mono text-sm text-white">{agent.developer.slice(0, 6)}...{agent.developer.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs uppercase text-white/60">Config</p>
                          <Link href={`/agent/${agent.numericId}`} className="font-mono text-sm text-white transition-colors hover:text-white/60">
                            [ VIEW ↗ ]
                          </Link>
                        </div>
                      </div>

                      {(agent.agentType === "content" || agent.agentType === "business") && (
                        <Link
                          href={`/agent/${agent.numericId}/run`}
                          className="inline-block border border-white bg-white px-6 py-2 font-headline uppercase text-black transition-colors hover:bg-black hover:text-white"
                        >
                          [ INTERACT ↗ ]
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-6 font-headline text-4xl uppercase text-white">Activity Feed</h2>

              {feedItems.length === 0 ? (
                <div className="border border-white/12 p-8">
                  <p className="font-mono text-xs uppercase text-white/60">
                    No activation or execution events found for this wallet yet.
                  </p>
                </div>
              ) : (
                <div className="border border-white/12">
                  {feedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-6 transition-colors hover:bg-white/5 ${index < feedItems.length - 1 ? "border-b border-white/12" : ""}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-headline text-lg uppercase text-white">{item.title}</h4>
                          <p className="text-sm text-white/60">{item.subtitle}</p>
                        </div>
                        <p className="font-mono text-xs text-white/40">{formatTimestamp(item.timestamp)}</p>
                      </div>
                      <p className="font-mono text-xs text-white/80">{item.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/marketplace"
            className="inline-block border border-white bg-white px-12 py-4 font-headline text-2xl uppercase text-black transition-colors hover:bg-black hover:text-white"
          >
            [ ADD MORE AGENTS ↗ ]
          </Link>
        </div>
      </div>
    </main>
  );
}
