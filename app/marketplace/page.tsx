"use client";

import { useState } from "react";
import { TopNavBar } from "@/components/TopNavBar";
import { AgentCard } from "@/components/AgentCard";
import { useReveal, useStaggerReveal } from "@/hooks/useScrollAnimation";

const AGENTS = [
  {
    id: 1,
    name: "Trading Bot",
    type: "TRADING",
    description:
      "Monitors price thresholds and executes swaps across multiple liquidity pools with precision timing.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCP9WykVHXlBO4UR2yXu_3m-9IlbFZ2gQIcMEdQEFf9kGLNUq3OsUSKEd-VP82nlecVqwhbNq-gonLvflkS3USYdgiPjK3LnO14jyjCtsyoXoWhgddIoMD7l4mDOaljT05Z6K5HXw2-DtHyNQRWIr3YVhYzViY-zmT2_q0hdYaHqqVYeK02HmzB_BbVzpyU-W444Ddm1M8nXvvT5padIoGxZGyKmLtGHJA73rLAHpMHnKxe3z179wvZf3q8lJpEHjZkxmW_IL2iOFY",
    price: 2.5,
    activeCount: 24,
    isLive: true,
  },
  {
    id: 2,
    name: "Yield Orchestrator",
    type: "FARMING",
    description:
      "Auto-compounds yield, monitors LP positions and suggests optimal farming strategies.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsYXxIvzCasfwu0KjYNIBqyp1bFixdCnGRqahsrugyzKTdlpaGYJekeVsoCU80cL0ClsaNm1FUZV7OHNfe7ilj-_l2COB9BDtlqOfu0HEjItghJg8n2BazGMVB6NGd_jKE5p3iIUTBOuXIBCUcdRPsNbvuOncUKAoiw2vvz28Edhtyu7cNaMo24d13vtgrzJqATCd0DPQq1HH72HD6hjJ4vCZ6_nWMAJrgRtul6oDOhyJ9D95rrWRDMpXWM8gJgn5MwzQSljgigWY",
    price: 0.8,
    activeCount: 812,
    isLive: true,
  },
  {
    id: 3,
    name: "Social Sentinel",
    type: "CONTENT",
    description:
      "Gemini-powered social media content auto-responder with tone customization.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdvfCf5x6E9xZ1AIosqHI4a2tE0JdCcz9eA6a0Mg1XVmXbiUf9tvBcRRdtvhuLii5lPeODU7FR5BT6cbAZZOH8IW5iM6UcR9es5YxQdlDcFnKhHDEhkzm25txi8bCgKRgLbhTJdgJ4ptuZK6HaIddvX8vLhaAL8LvsrsMB3dGgrVmUAgyYqRN9SDUWaz-CfvrK2r8-dBCa57ZYpspB8HEKiGrXhWrUoI3-LDWeMc8dOjvKSHsWXCLg8frA1SnBPO4ihdmXdOGczmY",
    price: 1.2,
    activeCount: 12,
    isLive: false,
  },
  {
    id: 4,
    name: "Arb Master Z",
    type: "TRADING",
    description: "Advanced arbitrage detection and execution across DEX pools.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnv7KX2CUfHTtVNxA3N1yyGsjzDYkP_tVm03JkSp3rGuTJQF3OvgGDqR9hxevv8RomyvjQ6-OpASMXLDOTmas1e_LExvngr7iYa9-gZKbhMMtfxN2_QEUutB8pNwKVbqGnEG4pdiorgTct8ZPrxVV1m9RqZGcuRbQ1S9Pzs4Vnw9j5CXoVZVBXmQ5nwmxi5VxpPjwhUcoI6Il77MiHdn5XqHSFwI8z4rfxhVaUDWKbf80d-7E65rlm75sk4g5o6hL3I5FpuJ6K6X8",
    price: 4.2,
    activeCount: 56,
    isLive: true,
  },
  {
    id: 5,
    name: "Schedule Master",
    type: "SCHEDULING",
    description:
      "Recurring HLUSD payments on customizable time-based triggers.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCP9WykVHXlBO4UR2yXu_3m-9IlbFZ2gQIcMEdQEFf9kGLNUq3OsUSKEd-VP82nlecVqwhbNq-gonLvflkS3USYdgiPjK3LnO14jyjCtsyoXoWhgddIoMD7l4mDOaljT05Z6K5HXw2-DtHyNQRWIr3YVhYzViY-zmT2_q0hdYaHqqVYeK02HmzB_BbVzpyU-W444Ddm1M8nXvvT5padIoGxZGyKmLtGHJA73rLAHpMHnKxe3z179wvZf3q8lJpEHjZkxmW_IL2iOFY",
    price: 0.5,
    activeCount: 234,
    isLive: true,
  },
  {
    id: 6,
    name: "Portfolio Rebalancer",
    type: "REBALANCING",
    description:
      "Monitors wallet allocation drift and suggests rebalancing trades.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsYXxIvzCasfwu0KjYNIBqyp1bFixdCnGRqahsrugyzKTdlpaGYJekeVsoCU80cL0ClsaNm1FUZV7OHNfe7ilj-_l2COB9BDtlqOfu0HEjItghJg8n2BazGMVB6NGd_jKE5p3iIUTBOuXIBCUcdRPsNbvuOncUKAoiw2vvz28Edhtyu7cNaMo24d13vtgrzJqATCd0DPQq1HH72HD6hjJ4vCZ6_nWMAJrgRtul6oDOhyJ9D95rrWRDMpXWM8gJgn5MwzQSljgigWY",
    price: 1.8,
    activeCount: 89,
    isLive: true,
  },
  {
    id: 7,
    name: "Business Assistant",
    type: "BUSINESS",
    description: "Gemini AI answers queries, drafts emails, and summarizes documents.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnv7KX2CUfHTtVNxA3N1yyGsjzDYkP_tVm03JkSp3rGuTJQF3OvgGDqR9hxevv8RomyvjQ6-OpASMXLDOTmas1e_LExvngr7iYa9-gZKbhMMtfxN2_QEUutB8pNwKVbqGnEG4pdiorgTct8ZPrxVV1m9RqZGcuRbQ1S9Pzs4Vnw9j5CXoVZVBXmQ5nwmxi5VxpPjwhUcoI6Il77MiHdn5XqHSFwI8z4rfxhVaUDWKbf80d-7E65rlm75sk4g5o6hL3I5FpuJ6K6X8",
    price: 2.0,
    activeCount: 156,
    isLive: true,
  },
];

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
  const headerRef = useReveal(0);
  const gridRef = useStaggerReveal(100);

  const filteredAgents =
    selectedType === "ALL"
      ? AGENTS
      : AGENTS.filter((agent) => agent.type === selectedType);

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* Page Header */}
      <header ref={headerRef} className="px-8 pt-16 pb-8 border-b border-white/10 mt-24 reveal-up">
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
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
        {filteredAgents.map((agent) => (
          <div key={agent.id} data-item>
            <AgentCard {...agent} />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
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
