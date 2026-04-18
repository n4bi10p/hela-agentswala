"use client";

import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { useReveal, useStaggerReveal } from "@/hooks/useScrollAnimation";

const SAMPLE_ACTIVE_AGENTS = [
  { id: 1, name: "Trading Bot", type: "TRADING", activatedAt: "2024-01-15", status: "RUNNING", lastExecution: "2 minutes ago", executions: 234 },
  { id: 2, name: "Yield Orchestrator", type: "FARMING", activatedAt: "2024-01-10", status: "RUNNING", lastExecution: "30 seconds ago", executions: 89 },
  { id: 3, name: "Social Sentinel", type: "CONTENT", activatedAt: "2024-01-08", status: "IDLE", lastExecution: "1 hour ago", executions: 12 },
];

const ACTIVITY_LOG = [
  { id: 1, agent: "Trading Bot", action: "Executed swap", timestamp: "2 minutes ago", details: "10 HLUSD → 0.45 ETH" },
  { id: 2, agent: "Yield Orchestrator", action: "Compounded yield", timestamp: "30 seconds ago", details: "+2.5 LP tokens" },
  { id: 3, agent: "Social Sentinel", action: "Generated replies", timestamp: "1 hour ago", details: "3 response options created" },
  { id: 4, agent: "Trading Bot", action: "Price alert triggered", timestamp: "2 hours ago", details: "HLUSD/ETH threshold reached" },
  { id: 5, agent: "Schedule Master", action: "Payment sent", timestamp: "5 hours ago", details: "100 HLUSD → recipient" },
];

export default function DashboardPage() {
  const headerRef = useReveal(0);
  const statsRef = useStaggerReveal(120);
  const agentsHeadRef = useReveal(0);
  const agentsRef = useStaggerReveal(150);
  const activityHeadRef = useReveal(0);
  const activityRef = useStaggerReveal(80);
  const ctaRef = useReveal(0);

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* Page Header */}
      <header ref={headerRef} className="px-8 pt-16 pb-8 border-b border-white/10 mt-24 reveal-up">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-sm text-white bracket-link cursor-pointer">DASHBOARD</span>
          <span className="font-mono text-sm text-white/20 select-none">░░░░░░░░░░░░░░</span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">AGENTS</h1>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Stats Row */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Active Agents", value: SAMPLE_ACTIVE_AGENTS.length },
            { label: "Total Executions", value: SAMPLE_ACTIVE_AGENTS.reduce((sum, a) => sum + a.executions, 0) },
            { label: "Running Agents", value: SAMPLE_ACTIVE_AGENTS.filter((a) => a.status === "RUNNING").length },
          ].map((stat, i) => (
            <div key={i} data-item className="border border-white/12 p-6 flex flex-col gap-2 hover:border-white/40 transition-all duration-500 hover:bg-white/[0.04]">
              <p className="text-white/60 font-mono text-xs uppercase">{stat.label}</p>
              <p className="font-headline text-6xl text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Active Agents Section */}
        <div className="mb-12">
          <div ref={agentsHeadRef} className="reveal-left">
            <h2 className="font-headline text-4xl text-white mb-6 uppercase">Your Active Agents</h2>
          </div>
          <div ref={agentsRef} className="space-y-4">
            {SAMPLE_ACTIVE_AGENTS.map((agent) => (
              <div key={agent.id} data-item className="border border-white/12 p-6 hover:border-white transition-all duration-500 group hover:bg-white/[0.04]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline text-2xl text-white uppercase">{agent.name}</h3>
                    <p className="text-white/60 font-mono text-xs">{agent.type}</p>
                  </div>
                  <div className={`flex items-center gap-2 font-mono text-xs ${agent.status === "RUNNING" ? "text-live-signal" : "text-white/20"}`}>
                    <span className={`w-2 h-2 rounded-full ${agent.status === "RUNNING" ? "bg-live-signal animate-pulse" : "bg-white/20"}`}></span>
                    {agent.status}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-white/60 font-mono text-xs uppercase">Activated</p><p className="text-white font-mono text-sm">{agent.activatedAt}</p></div>
                  <div><p className="text-white/60 font-mono text-xs uppercase">Last Execution</p><p className="text-white font-mono text-sm">{agent.lastExecution}</p></div>
                  <div><p className="text-white/60 font-mono text-xs uppercase">Total Runs</p><p className="text-white font-mono text-sm">{agent.executions}</p></div>
                  <div><p className="text-white/60 font-mono text-xs uppercase">Config</p><Link href={`/agent/${agent.id}`} className="text-white font-mono text-sm hover:text-white/60 transition-colors">[ EDIT ↗ ]</Link></div>
                </div>
                {agent.type === "CONTENT" || agent.type === "BUSINESS" ? (
                  <Link href={`/agent/${agent.id}/run`} className="inline-block w-full md:w-auto bg-white text-black px-6 py-2 font-headline hover:bg-black hover:text-white border border-white transition-colors uppercase glow-effect">[ INTERACT ↗ ]</Link>
                ) : (
                  <button className="inline-block w-full md:w-auto bg-transparent text-white px-6 py-2 font-headline border border-white hover:bg-white hover:text-black transition-colors uppercase cursor-not-allowed opacity-50">[ VIEW LOGS ↗ ]</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log Section */}
        <div>
          <div ref={activityHeadRef} className="reveal-right">
            <h2 className="font-headline text-4xl text-white mb-6 uppercase">Activity Feed</h2>
          </div>
          <div ref={activityRef} className="border border-white/12">
            {ACTIVITY_LOG.map((log, idx) => (
              <div key={log.id} data-item className={`p-6 hover:bg-white/5 transition-colors ${idx < ACTIVITY_LOG.length - 1 ? "border-b border-white/12" : ""}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-headline text-lg text-white uppercase">{log.agent}</h4>
                    <p className="text-white/60 font-body text-sm">{log.action}</p>
                  </div>
                  <p className="text-white/40 font-mono text-xs">{log.timestamp}</p>
                </div>
                <p className="text-white/80 font-mono text-xs">{log.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="mt-12 text-center reveal-scale">
          <Link href="/marketplace" className="inline-block bg-white text-black px-12 py-4 font-headline text-2xl hover:bg-black hover:text-white border border-white transition-colors uppercase glow-effect">[ ADD MORE AGENTS ↗ ]</Link>
        </div>
      </div>
    </main>
  );
}
