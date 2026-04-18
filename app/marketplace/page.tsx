"use client";

import { formatUnits } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import { AgentCard } from "@/components/AgentCard";
import { fetchAgentActivationCount, fetchAllAgents, type AgentStruct } from "@/lib/contracts";
import { getAgentImage, toAgentTypeLabel } from "@/lib/agentUi";

type MarketplaceAgent = {
  id: number;
  name: string;
  type: string;
  description: string;
  image: string;
  price: number;
  activeCount: number;
  isLive: boolean;
};

const AGENT_TYPES = ["ALL", "TRADING", "FARMING", "SCHEDULING", "REBALANCING", "CONTENT", "BUSINESS"];

function mapAgent(agent: AgentStruct, activeCount: number): MarketplaceAgent {
  return {
    id: Number(agent.id),
    name: agent.name,
    type: toAgentTypeLabel(agent.agentType),
    description: agent.description,
    image: getAgentImage(agent.agentType),
    price: Number(formatUnits(agent.priceHLUSD, 18)),
    activeCount,
    isLive: agent.isActive
  };
}

export default function MarketplacePage() {
  const [selectedType, setSelectedType] = useState("ALL");
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      try {
        setIsLoading(true);
        setError(null);

        const allAgents = await fetchAllAgents();
        const activationCounts = await Promise.all(
          allAgents.map((agent) => fetchAgentActivationCount(Number(agent.id)).catch(() => 0))
        );

        if (cancelled) {
          return;
        }

        setAgents(allAgents.map((agent, index) => mapAgent(agent, activationCounts[index] || 0)));
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load marketplace agents");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAgents = useMemo(
    () => (selectedType === "ALL" ? agents : agents.filter((agent) => agent.type === selectedType)),
    [agents, selectedType]
  );

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      <header className="mt-24 border-b border-white/10 px-8 pb-8 pt-16">
        <div className="mb-4 flex items-center gap-4">
          <span className="bracket-link cursor-pointer font-mono text-sm text-white">MARKETPLACE</span>
          <span className="select-none font-mono text-sm text-white/20">░░░░░░░░░░░░░░</span>
        </div>
        <h1 className="font-headline text-[120px] leading-none tracking-tight text-white">AGENTS</h1>
      </header>

      <section className="sticky top-24 z-40 flex flex-wrap gap-4 border-b border-white/10 bg-black px-8 py-6">
        {AGENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-6 py-2 font-headline text-xl tracking-widest transition-all ${
              selectedType === type
                ? "bg-white text-black"
                : "border border-white bg-transparent text-white hover:bg-white/5"
            }`}
          >
            {type}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <p className="font-mono text-sm uppercase text-white/60">Loading on-chain marketplace...</p>
        </div>
      ) : error ? (
        <div className="mx-8 my-10 border border-red-500/40 bg-red-500/5 p-6">
          <p className="font-headline text-2xl uppercase text-white">Marketplace unavailable</p>
          <p className="mt-2 font-mono text-xs text-white/60">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} {...agent} />
          ))}
        </div>
      )}

      {!isLoading && !error && filteredAgents.length === 0 && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h3 className="mb-4 font-headline text-4xl text-white">NO AGENTS FOUND</h3>
            <p className="text-white/60">Try selecting a different agent type</p>
          </div>
        </div>
      )}
    </main>
  );
}
