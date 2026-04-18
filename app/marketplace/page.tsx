"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import { AgentCard } from "@/components/AgentCard";

type MarketplaceAgent = {
  id: number;
  name: string;
  description: string;
  type: string;
  image: string;
  price: number;
  activeCount: number;
  isLive: boolean;
};

type AgentsRouteResponse = {
  agents?: MarketplaceAgent[];
  error?: string;
};

const AGENT_TYPES = [
  "ALL",
  "TRADING",
  "FARMING",
  "SCHEDULING",
  "REBALANCING",
  "CONTENT",
  "BUSINESS",
];

export default function MarketplacePage() {
  const [selectedType, setSelectedType] = useState("ALL");
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAgents() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/agents", {
          method: "GET",
          cache: "no-store"
        });

        const data = (await response.json()) as AgentsRouteResponse;
        if (!response.ok || !Array.isArray(data.agents)) {
          throw new Error(data.error || "Failed to load marketplace agents.");
        }

        if (active) {
          setAgents(data.agents);
        }
      } catch (error: unknown) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Failed to load marketplace agents.");
          setAgents([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAgents();
    return () => {
      active = false;
    };
  }, []);

  const filteredAgents = useMemo(() => {
    if (selectedType === "ALL") {
      return agents;
    }
    return agents.filter((agent) => agent.type === selectedType);
  }, [agents, selectedType]);

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* Page Header */}
      <header className="px-8 pt-16 pb-8 border-b border-white/10 mt-24">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-sm text-white bracket-link cursor-pointer">
            MARKETPLACE
          </span>
          <span className="font-mono text-sm text-white/20 select-none">
            ░░░░░░░░░░░░░░
          </span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">
          AGENTS
        </h1>
      </header>

      {/* Filter Tabs */}
      <section className="flex flex-wrap gap-4 px-8 py-6 bg-black border-b border-white/10 sticky top-24 z-40">
        {AGENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-6 py-2 font-headline text-xl tracking-widest transition-all ${
              selectedType === type
                ? "bg-white text-black"
                : "bg-transparent text-white border border-white hover:bg-white/5"
            }`}
          >
            {type}
          </button>
        ))}
      </section>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <p className="font-mono text-sm text-white/60 uppercase">Loading agents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} {...agent} />
          ))}
        </div>
      )}

      {loadError && (
        <div className="px-8 pb-8">
          <div className="border border-red-500/60 bg-red-500/10 p-4">
            <p className="font-mono text-xs text-red-200 uppercase">{loadError}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !loadError && filteredAgents.length === 0 && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h3 className="font-headline text-4xl text-white mb-4">
              NO AGENTS FOUND
            </h3>
            <p className="text-white/60">
              Try selecting a different agent type
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
