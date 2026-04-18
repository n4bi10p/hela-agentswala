"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { fetchHLUSDBalanceForAddress } from "@/lib/contracts";
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

type AutomationJobView = {
  id: string;
  agentId: string;
  ownerAddress: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  nextRunAt: string;
  lastRunAt?: string;
  status: "active" | "paused" | "error";
  userConfig: Record<string, unknown>;
  lastResult?: string;
  lastError?: string;
  lastExecutionTxHash?: string;
  agentWalletAddress: string | null;
};

type AutomationLogView = {
  id: string;
  agentId: string;
  ownerAddress: string;
  jobId?: string;
  success: boolean;
  result: string;
  txHash?: string;
  executedAt: string;
};

const FAUCET_URL = "https://testnet-faucet.helachain.com/";

function normalizeTimestampMs(value: number): number {
  if (value > 1_000_000_000_000) {
    return value;
  }
  return value * 1000;
}

function formatRelativeTime(value: number | string | null | undefined): string {
  if (!value) {
    return "Never";
  }

  const timestampMs =
    typeof value === "string" ? new Date(value).getTime() : normalizeTimestampMs(value);

  if (Number.isNaN(timestampMs)) {
    return "Never";
  }

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

function safeConfigPreview(config: Record<string, unknown>) {
  return Object.entries(config)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export default function DashboardPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<DashboardAgent[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [automationJobs, setAutomationJobs] = useState<AutomationJobView[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLogView[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runningAgentsCount = useMemo(
    () => activeAgents.filter((agent) => agent.isLive).length,
    [activeAgents]
  );

  const totalExecutions = useMemo(
    () => activeAgents.reduce((sum, agent) => sum + agent.executions, 0) + automationLogs.length,
    [activeAgents, automationLogs]
  );

  const combinedFeed = useMemo(() => {
    const automationItems = automationLogs.map((log) => ({
      id: `automation-${log.id}`,
      agentName: `Agent ${log.agentId}`,
      action: log.success ? "Automatic run succeeded" : "Automatic run failed",
      details: log.result,
      timestamp: new Date(log.executedAt).getTime(),
      kind: "execution" as const
    }));

    const routeItems = activityLog.map((item) => ({
      id: item.id,
      agentName: item.agentName,
      action: item.action,
      details: item.details,
      timestamp: normalizeTimestampMs(item.timestamp),
      kind: item.kind
    }));

    return [...routeItems, ...automationItems].sort((left, right) => right.timestamp - left.timestamp);
  }, [activityLog, automationLogs]);

  const handleCopyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      setError("Failed to copy agent wallet address.");
    }
  };

  const loadDashboardForAddress = useCallback(async (address: string) => {
    const [dashboardResponse, automationResponse] = await Promise.all([
      fetch(`/api/agents/user/${address}`, {
        method: "GET",
        cache: "no-store"
      }),
      fetch(`/api/automation/overview?ownerAddress=${encodeURIComponent(address)}`, {
        method: "GET",
        cache: "no-store"
      }).catch(() => null)
    ]);

    const dashboardData = (await dashboardResponse.json()) as DashboardRouteResponse;
    if (!dashboardResponse.ok) {
      throw new Error(dashboardData.error || "Failed to load dashboard data.");
    }

    const nextJobs: AutomationJobView[] = [];
    const nextLogs: AutomationLogView[] = [];

    if (automationResponse) {
      const automationData = (await automationResponse.json()) as {
        jobs?: AutomationJobView[];
        logs?: AutomationLogView[];
        error?: string;
      };

      if (automationResponse.ok) {
        nextJobs.push(...(automationData.jobs || []));
        nextLogs.push(...(automationData.logs || []));
      }
    }

    const uniqueWallets = Array.from(
      new Set(nextJobs.map((job) => job.agentWalletAddress).filter((wallet): wallet is string => Boolean(wallet)))
    );

    const balances = Object.fromEntries(
      await Promise.all(
        uniqueWallets.map(async (wallet) => [wallet, await fetchHLUSDBalanceForAddress(wallet).catch(() => "0")] as const)
      )
    );

    setWalletAddress(dashboardData.walletAddress || address);
    setActiveAgents(Array.isArray(dashboardData.activeAgents) ? dashboardData.activeAgents : []);
    setActivityLog(Array.isArray(dashboardData.activity) ? dashboardData.activity : []);
    setAutomationJobs(nextJobs);
    setAutomationLogs(nextLogs);
    setWalletBalances(balances);
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
        setAutomationJobs([]);
        setAutomationLogs([]);
        setWalletBalances({});
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

      <header className="mt-24 border-b border-white/10 px-8 pb-8 pt-16">
        <div className="mb-4 flex items-center gap-4">
          <span className="cursor-pointer font-mono text-sm text-white bracket-link">DASHBOARD</span>
          <span className="select-none font-mono text-sm text-white/20">░░░░░░░░░░░░░░</span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">AGENTS</h1>
      </header>

      <div className="mx-auto max-w-7xl p-8">
        {!walletAddress && !isLoading && (
          <div className="mb-8 flex flex-col gap-4 border border-white/12 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline text-3xl uppercase text-white">Wallet Required</h2>
              <p className="font-body text-sm uppercase text-white/60">
                Connect MetaMask on HeLa to load active agents, automation jobs, and execution history.
              </p>
            </div>
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="border border-white bg-white px-6 py-3 font-headline uppercase text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50"
            >
              {isConnecting ? "CONNECTING..." : "[ CONNECT WALLET ↗ ]"}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-8 border border-red-500/60 bg-red-500/10 p-4">
            <p className="font-mono text-xs uppercase text-red-200">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mb-8 border border-white/12 p-6">
            <p className="font-mono text-sm uppercase text-white/60">Loading dashboard...</p>
          </div>
        )}

        {walletAddress && (
          <div className="mb-8 border border-white/12 p-4">
            <p className="font-mono text-xs uppercase text-white/60">Connected Wallet</p>
            <p className="break-all font-mono text-sm text-white">{walletAddress}</p>
          </div>
        )}

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="flex flex-col gap-2 border border-white/12 p-6">
            <p className="font-mono text-xs uppercase text-white/60">Active Agents</p>
            <p className="font-headline text-6xl text-white">{activeAgents.length}</p>
          </div>
          <div className="flex flex-col gap-2 border border-white/12 p-6">
            <p className="font-mono text-xs uppercase text-white/60">Total Executions</p>
            <p className="font-headline text-6xl text-white">{totalExecutions}</p>
          </div>
          <div className="flex flex-col gap-2 border border-white/12 p-6">
            <p className="font-mono text-xs uppercase text-white/60">Running Agents</p>
            <p className="font-headline text-6xl text-white">{runningAgentsCount}</p>
          </div>
          <div className="flex flex-col gap-2 border border-white/12 p-6">
            <p className="font-mono text-xs uppercase text-white/60">Automation Jobs</p>
            <p className="font-headline text-6xl text-white">{automationJobs.length}</p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 font-headline text-4xl uppercase text-white">Automation Jobs</h2>

          {automationJobs.length === 0 ? (
            <div className="border border-white/12 p-8">
              <p className="font-mono text-xs uppercase text-white/60">
                No automation jobs created yet. Open an automation-ready agent and create one.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {automationJobs.map((job) => (
                <div key={job.id} className="border border-white/12 p-6 transition-colors hover:border-white">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-2xl uppercase text-white">Agent {job.agentId}</h3>
                      <p className="font-mono text-xs uppercase text-white/60">Frequency: {job.frequency}</p>
                    </div>
                    <div
                      className={`font-mono text-xs uppercase ${
                        job.status === "active"
                          ? "text-live-signal"
                          : job.status === "error"
                            ? "text-red-400"
                            : "text-white/50"
                      }`}
                    >
                      {job.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Agent Wallet</p>
                      <p className="mt-1 break-all font-mono text-xs text-white/80">{job.agentWalletAddress || "Unavailable"}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Wallet Balance</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {job.agentWalletAddress ? `${walletBalances[job.agentWalletAddress] || "0"} HLUSD` : "0 HLUSD"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Next Run</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Last Run</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "Not yet"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Config Preview</p>
                      <p className="mt-1 font-mono text-xs text-white/80">{safeConfigPreview(job.userConfig)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Last Result</p>
                      <p className="mt-1 font-mono text-xs text-white/80">{job.lastError || job.lastResult || "No runs yet"}</p>
                    </div>
                  </div>

                  {job.agentWalletAddress && (
                    <div className="mt-4 flex flex-col gap-3 md:flex-row">
                      <button
                        onClick={() => handleCopyWalletAddress(job.agentWalletAddress!)}
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-12">
          <h2 className="mb-6 font-headline text-4xl uppercase text-white">Your Active Agents</h2>

          {activeAgents.length === 0 ? (
            <div className="border border-white/12 p-8 text-center">
              <p className="font-mono text-xs uppercase text-white/60">
                No active agents found for this wallet yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAgents.map((agent) => (
                <div key={agent.id} className="group border border-white/12 p-6 transition-colors hover:border-white">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-headline text-2xl uppercase text-white">{agent.name}</h3>
                      <p className="font-mono text-xs text-white/60">{agent.type}</p>
                    </div>
                    <div className={`flex items-center gap-2 font-mono text-xs ${agent.isLive ? "text-live-signal" : "text-white/20"}`}>
                      <span className={`h-2 w-2 rounded-full ${agent.isLive ? "bg-live-signal" : "bg-white/20"}`}></span>
                      {agent.isLive ? "RUNNING" : "IDLE"}
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Activated</p>
                      <p className="font-mono text-sm text-white">{formatDate(agent.activatedAt)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Last Execution</p>
                      <p className="font-mono text-sm text-white">{formatRelativeTime(agent.lastExecutionAt)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Total Runs</p>
                      <p className="font-mono text-sm text-white">{agent.executions}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-white/60">Config</p>
                      <Link href={`/agent/${agent.id}`} className="font-mono text-sm text-white transition-colors hover:text-white/60">
                        [ EDIT ↗ ]
                      </Link>
                    </div>
                  </div>

                  {(agent.agentType === "content" || agent.agentType === "business") ? (
                    <Link
                      href={`/agent/${agent.id}/run`}
                      className="inline-block w-full border border-white bg-white px-6 py-2 font-headline uppercase text-black transition-colors hover:bg-black hover:text-white md:w-auto"
                    >
                      [ INTERACT ↗ ]
                    </Link>
                  ) : (
                    <button className="inline-block w-full cursor-not-allowed border border-white px-6 py-2 font-headline uppercase text-white opacity-50 transition-colors hover:bg-white hover:text-black md:w-auto">
                      [ VIEW LOGS ↗ ]
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-6 font-headline text-4xl uppercase text-white">Activity Feed</h2>

          {combinedFeed.length === 0 ? (
            <div className="border border-white/12 p-8 text-center">
              <p className="font-mono text-xs uppercase text-white/60">
                No activity events available yet.
              </p>
            </div>
          ) : (
            <div className="border border-white/12">
              {combinedFeed.map((log, index) => (
                <div
                  key={log.id}
                  className={`p-6 transition-colors hover:bg-white/5 ${index < combinedFeed.length - 1 ? "border-b border-white/12" : ""}`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-headline text-lg uppercase text-white">{log.agentName}</h4>
                      <p className="font-body text-sm text-white/60">{log.action}</p>
                    </div>
                    <p className="font-mono text-xs text-white/40">{formatRelativeTime(log.timestamp)}</p>
                  </div>
                  <p className="font-mono text-xs text-white/80">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>

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
