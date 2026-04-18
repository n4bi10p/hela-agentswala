'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function AboutPage() {
  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <span className="text-sm opacity-60 uppercase">[ ABOUT ]</span>
            <h1 className="font-headline text-7xl font-bold mt-4 mb-8">Trovia</h1>
            <p className="font-body text-lg opacity-80 leading-relaxed">
              Decentralized AI agents for automated trading, yield farming, content creation, and business intelligence.
            </p>
          </div>

          {/* Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="border border-white/20 p-8">
              <h2 className="font-headline text-3xl font-bold mb-4">Mission</h2>
              <p className="font-body text-sm opacity-80 leading-relaxed">
                To empower users with autonomous, AI-driven agents that execute complex tasks across finance, trading, and business intelligence with trust, transparency, and decentralization at their core.
              </p>
            </div>

            <div className="border border-white/20 p-8">
              <h2 className="font-headline text-3xl font-bold mb-4">Vision</h2>
              <p className="font-body text-sm opacity-80 leading-relaxed">
                A future where intelligent agents handle routine tasks, enabling humans to focus on strategy and growth while blockchain technology ensures security and transparency.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="font-headline text-4xl font-bold mb-8">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border border-white/20 p-6">
                <h3 className="font-bold text-lg mb-3">Decentralization</h3>
                <p className="font-body text-sm opacity-70">No central authority. Users maintain full control of their agents and funds.</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="font-bold text-lg mb-3">Transparency</h3>
                <p className="font-body text-sm opacity-70">All agent logic and execution is auditable on-chain with full execution logs.</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="font-bold text-lg mb-3">Security</h3>
                <p className="font-body text-sm opacity-70">Smart contract audits and escrow mechanisms protect user funds at every step.</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="font-bold text-lg mb-3">Innovation</h3>
                <p className="font-body text-sm opacity-70">Pushing the boundaries of what's possible with autonomous AI agents.</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="font-bold text-lg mb-3">Accessibility</h3>
                <p className="font-body text-sm opacity-70">Making advanced agent automation available to everyone, not just institutions.</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="font-bold text-lg mb-3">Community</h3>
                <p className="font-body text-sm opacity-70">Built by and for the community. Developer-friendly and open to contributions.</p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mb-16">
            <h2 className="font-headline text-4xl font-bold mb-8">Technology</h2>
            <div className="border border-white/20 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-4">Frontend</h3>
                  <ul className="font-body text-sm opacity-70 space-y-2">
                    <li>• Next.js 14 with App Router</li>
                    <li>• React 18 + TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• MetaMask Integration</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-4">Blockchain</h3>
                  <ul className="font-body text-sm opacity-70 space-y-2">
                    <li>• HeLa Testnet (Chain ID 8668)</li>
                    <li>• Smart Contracts (Solidity)</li>
                    <li>• Ethers.js v6</li>
                    <li>• Agent Escrow & Execution</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-4">AI</h3>
                  <ul className="font-body text-sm opacity-70 space-y-2">
                    <li>• Google Gemini API</li>
                    <li>• Natural Language Processing</li>
                    <li>• Agent Intelligence Layer</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-4">Infrastructure</h3>
                  <ul className="font-body text-sm opacity-70 space-y-2">
                    <li>• API Routes (Next.js)</li>
                    <li>• Cloud Deployment Ready</li>
                    <li>• Health Monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="font-headline text-4xl font-bold mb-8">Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Aman",
                  role: "Frontend Engineering",
                  specialty: "Coding",
                  linkedin: "https://www.linkedin.com/in/aman-choudhary-01a836329/",
                  github: "https://github.com/Aman0choudhary"
                },
                {
                  name: "Nabil",
                  role: "Smart Contracts + Blockchain",
                  specialty: "Lead",
                  linkedin: "https://www.linkedin.com/in/n4bi10p/",
                  github: "https://github.com/n4bi10p"
                },
                {
                  name: "Bhoomi",
                  role: "AI Agent Execution Engine",
                  specialty: "Core Execution",
                  linkedin: "https://www.linkedin.com/in/bhoomi-awhad/",
                  github: "https://github.com/Bhoomi-112"
                },
                {
                  name: "Madhura",
                  role: "Frontend Design & UX",
                  specialty: "Design",
                  linkedin: "https://www.linkedin.com/in/madhura-kene-a471503b4?utm_source=share_via_utm_content=profile_utm_medium=member_android",
                  github: "https://github.com/Madhura-kene"
                },
                {
                  name: "Saad",
                  role: "Research, Testing & Content",
                  specialty: "QA & Research",
                  linkedin: "https://www.linkedin.com/in/saad-junedi-503470331",
                  github: "https://github.com/Saadjunedi07"
                }
              ].map((member, idx) => (
                <div key={idx} className="border border-white/20 p-6 hover:border-white/60 transition-all duration-300 group hover:bg-white/5">
                  <h3 className="font-headline text-2xl font-bold mb-2">{member.name}</h3>
                  <p className="font-body text-sm opacity-70 mb-1">{member.role}</p>
                  <p className="font-mono text-xs opacity-50 mb-4">[ {member.specialty} ]</p>
                  <div className="flex gap-4">
                    <Link
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white transition-colors text-sm font-mono"
                    >
                      [ LinkedIn ]
                    </Link>
                    <Link
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white transition-colors text-sm font-mono"
                    >
                      [ GitHub ]
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="border border-white/20 p-12 text-center">
            <h2 className="font-headline text-3xl font-bold mb-4">Join the Agent Revolution</h2>
            <p className="font-body text-sm opacity-70 mb-8">Start automating your crypto strategy with AI-powered agents today.</p>
            <Link href="/marketplace" className="inline-block bg-white text-black px-8 py-3 font-bold hover:opacity-80 transition">
              [ BROWSE AGENTS ]
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
