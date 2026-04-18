'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function PricingPage() {
  const agents = [
    { name: "Trading Agent", price: "50", period: "per activation", features: ["Price monitoring", "Automated swaps", "Slippage protection"] },
    { name: "Yield Orchestrator", price: "40", period: "per activation", features: ["LP yield tracking", "Auto-compound", "Risk alerts"] },
    { name: "Social Sentinel", price: "30", period: "per activation", features: ["Content generation", "Multi-option replies", "AI-powered"] },
    { name: "Arb Master Z", price: "60", period: "per activation", features: ["Arbitrage detection", "Cross-chain", "Fast execution"] },
    { name: "Schedule Master", price: "25", period: "per activation", features: ["Recurring payments", "Flexible scheduling", "Low fees"] },
    { name: "Business Assistant", price: "35", period: "per activation", features: ["Business insights", "Market analysis", "Strategic advice"] }
  ];

  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-6xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ PRICING ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-4">Agent Pricing</h1>
          <p className="font-body text-lg opacity-80 mb-12">Simple, transparent pricing. Pay only for what you use.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {agents.map((agent, idx) => (
              <div key={idx} className="border border-white/20 p-8 hover:border-white/40 transition-colors flex flex-col">
                <h3 className="font-bold text-lg text-white mb-2">{agent.name}</h3>
                <div className="mb-6 flex-1">
                  <span className="font-headline text-3xl font-bold">{agent.price}</span>
                  <span className="font-body text-xs opacity-60 ml-2">HLUSD {agent.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {agent.features.map((feature, i) => (
                    <li key={i} className="font-body text-sm opacity-70 flex items-center">
                      <span className="mr-2">✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <Link href={`/agent/${idx + 1}`} className="w-full border border-white text-white py-2 text-center hover:bg-white hover:text-black transition font-bold">
                  [ ACTIVATE ]
                </Link>
              </div>
            ))}
          </div>

          <div className="border border-white/20 p-8 mb-12">
            <h2 className="font-bold text-2xl mb-6">Pricing Tiers</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="font-body">Single Agent Activation</span>
                <span className="font-bold">Agent-specific price</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="font-body">Multiple Agents</span>
                <span className="font-bold">Stack discounts available</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="font-body">Execution Fees</span>
                <span className="font-bold">Included in activation</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-body">Refunds</span>
                <span className="font-bold">Pro-rata based on usage</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-white/20 p-6 text-center">
              <h3 className="font-bold text-white mb-2">Free Testnet</h3>
              <p className="font-body text-sm opacity-70">Get HLUSD from faucet and experiment risk-free</p>
            </div>
            <div className="border border-white/20 p-6 text-center">
              <h3 className="font-bold text-white mb-2">No Gas Fees</h3>
              <p className="font-body text-sm opacity-70">HeLa testnet has minimal transaction costs</p>
            </div>
            <div className="border border-white/20 p-6 text-center">
              <h3 className="font-bold text-white mb-2">Transparent</h3>
              <p className="font-body text-sm opacity-70">See exact costs before activating any agent</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <Link href="/marketplace" className="text-white hover:opacity-60 transition">
              Browse Agents →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
