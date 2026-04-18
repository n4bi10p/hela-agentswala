'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function RoadmapPage() {
  const roadmapItems = [
    {
      quarter: "Q2 2026",
      status: "In Progress",
      items: [
        "HeLa testnet deployment",
        "Agent marketplace launch",
        "MetaMask integration",
        "6 initial agent types"
      ]
    },
    {
      quarter: "Q3 2026",
      status: "Planned",
      items: [
        "Mainnet deployment",
        "10+ new agent types",
        "Advanced dashboard analytics",
        "Agent cloning feature",
        "Community governance"
      ]
    },
    {
      quarter: "Q4 2026",
      status: "Planned",
      items: [
        "Mobile app launch",
        "API for third-party integration",
        "Advanced backtesting tools",
        "Agent performance benchmarks",
        "Enterprise features"
      ]
    },
    {
      quarter: "Q1 2027",
      status: "Planned",
      items: [
        "Multi-chain support",
        "Advanced AI training",
        "DAO governance",
        "Decentralized agent execution",
        "Institutional partnerships"
      ]
    }
  ];

  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ ROADMAP ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-8">Product Roadmap</h1>
          <p className="font-body text-lg opacity-80 mb-12">Our vision for the future of decentralized AI agents.</p>

          <div className="space-y-8">
            {roadmapItems.map((item, idx) => (
              <div key={idx} className="border border-white/20 p-8 hover:border-white/40 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-headline text-2xl font-bold">{item.quarter}</h2>
                  <span className={`px-3 py-1 text-xs font-bold border ${
                    item.status === 'In Progress' 
                      ? 'border-green-500 text-green-500' 
                      : 'border-white/40 text-white/60'
                  }`}>
                    [ {item.status} ]
                  </span>
                </div>
                <ul className="space-y-3">
                  {item.items.map((subitem, i) => (
                    <li key={i} className="font-body text-sm opacity-70 flex items-center">
                      <span className="mr-3 text-green-500">→</span>
                      {subitem}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="font-body text-xs opacity-60 mb-2">CURRENT PHASE</p>
              <p className="font-headline text-2xl font-bold">Testnet</p>
            </div>
            <div className="text-center">
              <p className="font-body text-xs opacity-60 mb-2">AGENTS LIVE</p>
              <p className="font-headline text-2xl font-bold">6</p>
            </div>
            <div className="text-center">
              <p className="font-body text-xs opacity-60 mb-2">NEXT MILESTONE</p>
              <p className="font-headline text-2xl font-bold">Q3 2026</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="font-body text-sm opacity-60 mb-4">Stay updated on our progress</p>
            <div className="flex gap-4">
              <Link href="/blog" className="text-white hover:opacity-60 transition">[ BLOG ]</Link>
              <Link href="/contact" className="text-white hover:opacity-60 transition">[ CONTACT ]</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
