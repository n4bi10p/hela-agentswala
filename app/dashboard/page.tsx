"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { connectWallet, ensureHeLaNetwork, getConnectedAccount } from "@/lib/wallet";

type DashboardAgent = {
  id: number;
  name: string;
  description: string;
  type: string;
  agentType: string;
  isLive: boolean;
  activatedAt: number | null;
  lastExecutionAt: number | null;
  executions: number;
};

type ActivityItem = {
  id: string;
  kind: "activation" | "execution";
  agentId: number;
  agentName: string;
  action: string;
  details: string;
  timestamp: number;
  txHash: string;
};

type DashboardRouteResponse = {
  walletAddress?: string;
  activeAgents?: DashboardAgent[];
  activity?: ActivityItem[];
  error?: string;
};

function normalizeTimestampMs(value: number): number {
  if (value > 1_000_000_000_000) {
    return value;
  }
  return value * 1000;
}

function formatRelativeTime(value: number | null): string {
  if (!value) {
    return "Never";
  }

  const timestampMs = normalizeTimestampMs(value);
  const deltaMs = Date.now() - timestampMs;
  if (deltaMs <= 0) {
    return "Just now";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < minute) {
    return "Just now";
  }

  if (deltaMs < hour) {
    const minutes = Math.floor(deltaMs / minute);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < day) {
    const hours = Math.floor(deltaMs / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(deltaMs / day);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDate(value: number | null): string {
  if (!value) {
    return "-";
  }

  return new Date(normalizeTimestampMs(value)).toLocaleDateString();
}

export default function DashboardPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<DashboardAgent[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runningAgentsCount = useMemo(
    () => activeAgents.filter((agent) => agent.isLive).length,
    [activeAgents]
  );

  const totalExecutions = useMemo(
    () => activeAgents.reduce((sum, agent) => sum + agent.executions, 0),
    [activeAgents]
  );

  const loadDashboardForAddress = useCallback(async (address: string) => {
    const response = await fetch(`/api/agents/user/${address}`, {
      method: "GET",
      cache: "no-store"
    });

    const data = (await response.json()) as DashboardRouteResponse;
    if (!response.ok) {
      throw new Error(data.error || "Failed to load dashboard data.");
    }

    setWalletAddress(data.walletAddress || address);
    setActiveAgents(Array.isArray(data.activeAgents) ? data.activeAgents : []);
    setActivityLog(Array.isArray(data.activity) ? data.activity : []);
  }, []);

  const bootstrapDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const connected = await getConnectedAccount();
      if (!connected) {
        setWalletAddress(null);
        setActiveAgents([]);
        setActivityLog([]);
        setError("Connect your MetaMask wallet to load your dashboard.");
        return;
      }

      await loadDashboardForAddress(connected);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [loadDashboardForAddress]);

  useEffect(() => {
    void bootstrapDashboard();
  }, [bootstrapDashboard]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const account = await connectWallet();
      await ensureHeLaNetwork();
      await loadDashboardForAddress(account);
    } catch (connectError: unknown) {
      setError(connectError instanceof Error ? connectError.message : "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* Page Header */}
      <header className="px-8 pt-16 pb-8 border-b border-white/10 mt-24">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-sm text-white bracket-link cursor-pointer">
            DASHBOARD
          </span>
          <span className="font-mono text-sm text-white/20 select-none">
            ░░░░░░░░░░░░░░
          </span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">
          AGENTS
        </h1>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        {!walletAddress && !isLoading && (
          <div className="border border-white/12 p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-headline text-3xl text-white uppercase">Wallet Required</h2>
              <p className="text-white/60 font-body text-sm uppercase">
                Connect MetaMask on HeLa to load active agents and execution history.
              </p>
            </div>
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="bg-white text-black px-6 py-3 font-headline hover:bg-black hover:text-white border border-white transition-colors uppercase disabled:opacity-50"
            >
              {isConnecting ? "CONNECTING..." : "[ CONNECT WALLET ↗ ]"}
            </button>
          </div>
        )}

        {error && (
          <div className="border border-red-500/60 bg-red-500/10 p-4 mb-8">
            <p className="font-mono text-xs text-red-200 uppercase">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="border border-white/12 p-6 mb-8">
            <p className="font-mono text-sm text-white/60 uppercase">Loading dashboard...</p>
          </div>
        )}

        {walletAddress && (
          <div className="border border-white/12 p-4 mb-8">
            <p className="font-mono text-xs text-white/60 uppercase">Connected Wallet</p>
            <p className="font-mono text-sm text-white break-all">{walletAddress}</p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border border-white/12 p-6 flex flex-col gap-2">
            <p className="text-white/60 font-mono text-xs uppercase">
              Active Agents
            </p>
            <p className="font-headline text-6xl text-white">
              {activeAgents.length}
            </p>
          </div>
          <div className="border border-white/12 p-6 flex flex-col gap-2">
            <p className="text-white/60 font-mono text-xs uppercase">
              Total Executions
            </p>
            <p className="font-headline text-6xl text-white">
              {totalExecutions}
            </p>
          </div>
          <div className="border border-white/12 p-6 flex flex-col gap-2">
            <p className="text-white/60 font-mono text-xs uppercase">
              Running Agents
            </p>
            <p className="font-headline text-6xl text-white">
              {runningAgentsCount}
            </p>
          </div>
        </div>

        {/* Active Agents Section */}
        <div className="mb-12">
          <h2 className="font-headline text-4xl text-white mb-6 uppercase">
            Your Active Agents
          </h2>

          {activeAgents.length === 0 ? (
            <div className="border border-white/12 p-8 text-center">
              <p className="font-mono text-xs text-white/60 uppercase">
                No active agents found for this wallet yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
            {activeAgents.map((agent) => (
              <div
                key={agent.id}
                className="border border-white/12 p-6 hover:border-white transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline text-2xl text-white uppercase">
                      {agent.name}
                    </h3>
                    <p className="text-white/60 font-mono text-xs">
                      {agent.type}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 font-mono text-xs ${
                      agent.isLive
                        ? "text-live-signal"
                        : "text-white/20"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.isLive
                          ? "bg-live-signal"
                          : "bg-white/20"
                      }`}
                    ></span>
                    {agent.isLive ? "RUNNING" : "IDLE"}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-white/60 font-mono text-xs uppercase">
                      Activated
                    </p>
                    <p className="text-white font-mono text-sm">
                      {formatDate(agent.activatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono text-xs uppercase">
                      Last Execution
                    </p>
                    <p className="text-white font-mono text-sm">
                      {formatRelativeTime(agent.lastExecutionAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono text-xs uppercase">
                      Total Runs
                    </p>
                    <p className="text-white font-mono text-sm">
                      {agent.executions}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono text-xs uppercase">
                      Config
                    </p>
                    <Link
                      href={`/agent/${agent.id}`}
                      className="text-white font-mono text-sm hover:text-white/60 transition-colors"
                    >
                      [ EDIT ↗ ]
                    </Link>
                  </div>
                </div>

                {agent.agentType === "content" || agent.agentType === "business" ? (
                  <Link
                    href={`/agent/${agent.id}/run`}
                    className="inline-block w-full md:w-auto bg-white text-black px-6 py-2 font-headline hover:bg-black hover:text-white border border-white transition-colors uppercase"
                  >
                    [ INTERACT ↗ ]
                  </Link>
                ) : (
                  <button className="inline-block w-full md:w-auto bg-transparent text-white px-6 py-2 font-headline border border-white hover:bg-white hover:text-black transition-colors uppercase cursor-not-allowed opacity-50">
                    [ VIEW LOGS ↗ ]
                  </button>
                )}
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Activity Log Section */}
        <div>
          <h2 className="font-headline text-4xl text-white mb-6 uppercase">
            Activity Feed
          </h2>

          {activityLog.length === 0 ? (
            <div className="border border-white/12 p-8 text-center">
              <p className="font-mono text-xs text-white/60 uppercase">
                No activity events available yet.
              </p>
            </div>
          ) : (
            <div className="border border-white/12">
            {activityLog.map((log, idx) => (
              <div
                key={log.id}
                className={`p-6 hover:bg-white/5 transition-colors ${
                  idx < activityLog.length - 1 ? "border-b border-white/12" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-headline text-lg text-white uppercase">
                      {log.agentName}
                    </h4>
                    <p className="text-white/60 font-body text-sm">
                      {log.action}
                    </p>
                  </div>
                  <p className="text-white/40 font-mono text-xs">
                    {formatRelativeTime(log.timestamp)}
                  </p>
                </div>
                <p className="text-white/80 font-mono text-xs">{log.details}</p>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/marketplace"
            className="inline-block bg-white text-black px-12 py-4 font-headline text-2xl hover:bg-black hover:text-white border border-white transition-colors uppercase"
          >
            [ ADD MORE AGENTS ↗ ]
          </Link>
        </div>
      </div>
    </main>
  );
}
