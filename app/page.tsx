'use client';

import Link from "next/link";
import { TopNavBar } from "@/components/TopNavBar";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Home() {
  const heroRef = useScrollAnimation();
  const howItWorksRef = useScrollAnimation();
  const aboutRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();
  const faqRef = useScrollAnimation();
  const roadmapRef = useScrollAnimation();
  const statsRef = useScrollAnimation();
  const developerRef = useScrollAnimation();
  const footerRef = useScrollAnimation();

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center border-b border-white/12 pt-24 overflow-hidden">
        {/* Animated blur backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="absolute top-12 left-8 text-6xl font-thin text-white/20 select-none">[</div>
        <div className="absolute top-12 right-8 text-6xl font-thin text-white/20 select-none">]</div>
        <h1 className="font-headline text-[14vw] leading-none text-white whitespace-nowrap opacity-100 mb-8 select-none animate-[fadeInUp_0.8s_ease-out]">TROVIA</h1>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="font-headline text-4xl md:text-6xl text-center max-w-4xl tracking-tight text-white animate-[fadeInUp_0.8s_ease-out_0.2s_both]">BRINGING AI AGENTS ON-CHAIN</h2>
          <div className="flex flex-col items-center gap-4 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
            <Link href="/marketplace" className="bg-primary text-black px-12 py-4 font-headline text-2xl hover:bg-black hover:text-primary border border-primary transition-all duration-300 flex items-center gap-4 uppercase hover:shadow-lg hover:shadow-primary/50">[ START NOW ↗ ]</Link>
            <div className="font-mono text-white/30 text-xs tracking-[0.5em]">[ ░░░░░░░░░░ ]</div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center overflow-hidden">
          <div className="w-[800px] h-[800px] border border-white rounded-full flex items-center justify-center">
            <div className="w-[600px] h-[600px] border border-white rounded-full rotate-45"></div>
            <div className="w-[600px] h-[600px] border border-white rounded-full -rotate-45"></div>
          </div>
        </div>
        <div className="absolute bottom-12 right-8 bg-white text-black p-6 flex flex-col gap-2 min-w-[240px] hover:shadow-lg hover:shadow-white/20 transition-all duration-300">
          <div className="flex items-center gap-2 font-mono font-bold uppercase"><span className="text-xl">⬡</span> HeLa Chain</div>
          <p className="text-xs uppercase font-bold opacity-60">L1 Optimized for Autonomous Logic</p>
          <Link href="/publish" className="mt-2 font-headline text-lg border-b border-black inline-block self-start hover:opacity-70 transition-opacity">[ DEPLOY YOUR AGENT ↗ ]</Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howItWorksRef} className="grid grid-cols-1 md:grid-cols-3 border-b border-white/12 bg-black relative">
        {/* Blur effect background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        {[
          { number: "01", title: "BROWSE", description: "Access the repository of pre-trained, on-chain autonomous entities specialized in DeFi, Data mining, and Social orchestrations.", link: "/marketplace", linkText: "EXPLORE AGENTS" },
          { number: "02", title: "ACTIVATE", description: "Stake HLUSD to fund your agent's compute budget. Immutable contracts ensure execution remains persistent and verifiable.", link: "/marketplace", linkText: "STAKE & DEPLOY" },
          { number: "03", title: "RUNS FOR YOU", description: "Your agent executes 24/7 on the HeLa network, delivering results directly to your wallet via cross-chain messaging.", link: "/dashboard", linkText: "VIEW DASHBOARD" },
        ].map((item, idx) => (
          <div key={idx} className={`p-12 flex flex-col gap-8 ${idx < 2 ? "border-b md:border-b-0 md:border-r" : ""} border-white/12 relative group hover:bg-white/5 transition-all duration-300`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="font-headline text-4xl text-white relative z-10">[ {item.number} ↗ ]</div>
            <div className="relative z-10">
              <h3 className="font-headline text-3xl mb-4 text-white uppercase">{item.title}</h3>
              <p className="text-white/60 font-body text-sm leading-relaxed uppercase">{item.description}</p>
            </div>
            <Link href={item.link} className="font-mono text-xs text-white/40 hover:text-white uppercase relative z-10">[ {item.linkText} ↗ ]</Link>
          </div>
        ))}
      </section>

      {/* ABOUT SECTION */}
      <section ref={aboutRef} className="bg-black border-b border-white/12 px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ ABOUT ]</span>
          <h2 className="font-headline text-5xl font-bold mt-4 mb-12">Decentralized AI Agent Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border border-white/20 p-8 hover:border-white/60 transition-all duration-300 group hover:bg-white/5">
              <h3 className="font-headline text-2xl font-bold mb-4">Mission</h3>
              <p className="font-body text-sm opacity-80 group-hover:opacity-100 transition-opacity">To empower users with autonomous, AI-driven agents that execute complex tasks across finance, trading, and business intelligence with trust, transparency, and decentralization at their core.</p>
            </div>
            <div className="border border-white/20 p-8 hover:border-white/60 transition-all duration-300 group hover:bg-white/5">
              <h3 className="font-headline text-2xl font-bold mb-4">Vision</h3>
              <p className="font-body text-sm opacity-80 group-hover:opacity-100 transition-opacity">A future where intelligent agents handle routine tasks, enabling humans to focus on strategy and growth while blockchain technology ensures security and transparency.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Decentralization", desc: "No central authority. Full user control." },
              { title: "Transparency", desc: "All logic auditable on-chain." },
              { title: "Security", desc: "Smart contract escrow protection." },
            ].map((val, i) => (
              <div key={i} className="border border-white/20 p-6 hover:border-white/60 transition-all duration-300 group hover:bg-white/5">
                <h3 className="font-bold text-lg mb-2">{val.title}</h3>
                <p className="font-body text-sm opacity-70 group-hover:opacity-90 transition-opacity">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section ref={pricingRef} className="bg-black border-b border-white/12 px-8 py-24 relative overflow-hidden">
        {/* Blur effect background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <span className="text-sm opacity-60 uppercase">[ PRICING ]</span>
          <h2 className="font-headline text-5xl font-bold mt-4 mb-12">Agent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Trading Agent", price: "50 HLUSD", features: ["Price monitoring", "Automated swaps", "Slippage protection"] },
              { name: "Yield Orchestrator", price: "40 HLUSD", features: ["LP yield tracking", "Auto-compound", "Risk alerts"] },
              { name: "Social Sentinel", price: "30 HLUSD", features: ["Content generation", "AI-powered", "Multi-option replies"] },
              { name: "Arb Master Z", price: "60 HLUSD", features: ["Arbitrage detection", "Cross-chain", "Fast execution"] },
              { name: "Schedule Master", price: "25 HLUSD", features: ["Recurring payments", "Flexible scheduling", "Low fees"] },
              { name: "Business Assistant", price: "35 HLUSD", features: ["Business insights", "Market analysis", "Strategic advice"] },
            ].map((agent, idx) => (
              <div key={idx} className="border border-white/20 p-6 hover:border-white/60 transition-all duration-300 group hover:bg-white/5 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded"></div>
                <h3 className="font-bold text-lg mb-2 relative z-10">{agent.name}</h3>
                <div className="mb-4 relative z-10"><span className="text-2xl font-bold">{agent.price}</span></div>
                <ul className="space-y-2 mb-4 relative z-10">
                  {agent.features.map((f, i) => (
                    <li key={i} className="font-body text-sm opacity-70">✓ {f}</li>
                  ))}
                </ul>
                <Link href="/marketplace" className="text-white hover:opacity-60 text-sm relative z-10">[ ACTIVATE ] →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section ref={faqRef} className="bg-black border-b border-white/12 px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ FAQ ]</span>
          <h2 className="font-headline text-5xl font-bold mt-4 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "What is Trovia?", a: "A decentralized marketplace for AI agents that automate trading, yield farming, content, and business tasks." },
              { q: "How do I activate an agent?", a: "Browse marketplace, select an agent, configure settings, approve HLUSD payment via MetaMask." },
              { q: "What is HLUSD?", a: "The stablecoin used on HeLa testnet for agent payments and escrow." },
              { q: "Is my money safe?", a: "Funds are held in smart contract escrow. Always test with small amounts first." },
              { q: "Can I cancel an agent?", a: "Yes, deactivate from dashboard. Unused fees may be refunded." },
            ].map((faq, i) => (
              <div key={i} className="border border-white/20 p-4 hover:border-white/60 transition-all duration-300 group hover:bg-white/5">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="font-body text-sm opacity-70 group-hover:opacity-90 transition-opacity">{faq.a}</p>
              </div>
            ))}}
            <Link href="/faq" className="text-white hover:opacity-60 text-sm mt-4 block">View all FAQs →</Link>
          </div>
        </div>
      </section>

      {/* ROADMAP SECTION */}
      <section ref={roadmapRef} className="bg-black border-b border-white/12 px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ ROADMAP ]</span>
          <h2 className="font-headline text-5xl font-bold mt-4 mb-12">Product Roadmap</h2>
          <div className="space-y-6">
            {[
              { q: "Q2 2026", items: ["HeLa testnet launch", "6 initial agents", "MetaMask integration", "Agent marketplace"] },
              { q: "Q3 2026", items: ["Mainnet deployment", "10+ new agents", "Advanced analytics", "Community governance"] },
              { q: "Q4 2026", items: ["Mobile app", "API integration", "Backtesting tools", "Enterprise features"] },
            ].map((phase, i) => (
              <div key={i} className="border border-white/20 p-6 hover:border-white/60 transition-all duration-300 group hover:bg-white/5">
                <h3 className="font-bold text-lg mb-4">{phase.q}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, ii) => (
                    <li key={ii} className="font-body text-sm opacity-70 group-hover:opacity-90 transition-opacity">→ {item}</li>
                  ))}
                </ul>
              </div>
            ))}}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section ref={statsRef} className="bg-white text-black py-20 px-8 border-b border-white/12 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-0 relative z-10">
          {[
            { number: "6", label: "Agent Types" },
            { number: "100%", label: "On-Chain" },
            { number: "HLUSD", label: "Stable Gas" },
            { number: "8668", label: "Chain ID" },
          ].map((stat, idx) => (
            <div key={idx} className={`flex flex-col items-center md:items-start ${idx < 3 ? "md:border-r" : ""} border-black/10 px-8 group hover:opacity-60 transition-opacity duration-300`}>
              <div className="font-headline text-[96px] leading-none uppercase group-hover:scale-110 transition-transform duration-300">{stat.number}</div>
              <div className="font-mono text-sm font-bold uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEVELOPER CTA */}
      {/* DEVELOPER CTA */}
      <section ref={developerRef} className="p-8 md:p-24 bg-black border-t border-white/12 relative overflow-hidden">
        {/* Blur effect backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-headline text-[25vw] text-white/5 pointer-events-none select-none uppercase">BUILD</div>
        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          <div className="font-headline text-4xl md:text-5xl border border-white/20 px-6 py-2 text-white hover:border-white/60 hover:bg-white/5 transition-all duration-300">[ FOR DEVELOPERS ↗ ]</div>
          <h2 className="font-headline text-6xl md:text-8xl max-w-5xl text-white uppercase">BUILD AGENTS. EARN HLUSD.</h2>
          <div className="flex flex-col md:flex-row gap-6 mt-8">
            <Link href="/publish" className="bg-white text-black px-12 py-4 font-headline text-2xl hover:bg-black hover:text-white border border-white transition-all duration-300 uppercase hover:shadow-lg hover:shadow-white/20">[ PUBLISH ↗ ]</Link>
            <Link href="/marketplace" className="bg-transparent text-white px-12 py-4 font-headline text-2xl border border-white hover:bg-white hover:text-black transition-all duration-300 uppercase hover:shadow-lg hover:shadow-white/20">[ LEARN MORE ↗ ]</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer ref={footerRef} className="bg-black border-t border-white/12 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-bold mb-4">PRODUCT</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link href="/marketplace">Marketplace</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/publish">Publish</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">COMPANY</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><a href="#about">About</a></li>
                <li><a href="#roadmap">Roadmap</a></li>
                <li><a href="https://www.linkedin.com/in/aman-choudhary-01a836329/?lipi=urn%3Ali%3Apage%3Ad_flagship3_feed%3Bh0Fd%2B%2BwYTr6DXMLAJ4A9Fw%3D%3D" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">SUPPORT</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">LEGAL</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/12 pt-8 text-center text-sm opacity-60">
            <p>© 2026 Trovia. All rights reserved. | Built for DevClash 2026</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
