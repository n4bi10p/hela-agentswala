"use client";

import Link from "next/link";
import { TopNavBar } from "@/components/TopNavBar";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "BROWSE",
    description:
      "Access the repository of pre-trained, on-chain autonomous entities specialized in DeFi, data workflows, and business operations.",
    link: "/marketplace",
    linkText: "EXPLORE AGENTS"
  },
  {
    number: "02",
    title: "ACTIVATE",
    description:
      "Activate an agent with HLUSD through audited smart contracts so usage and payment remain transparent and verifiable.",
    link: "/marketplace",
    linkText: "ACTIVATE NOW"
  },
  {
    number: "03",
    title: "TRACK",
    description:
      "Monitor your activations and on-chain execution history from the dashboard with wallet-based visibility.",
    link: "/dashboard",
    linkText: "VIEW DASHBOARD"
  }
];

const PRICING_PREVIEW = [
  { name: "Trading Agent", price: "50 HLUSD", features: ["Price monitoring", "Automated swaps", "Risk controls"] },
  { name: "Yield Orchestrator", price: "40 HLUSD", features: ["LP yield tracking", "Auto-compound", "Allocation alerts"] },
  { name: "Schedule Master", price: "25 HLUSD", features: ["Recurring transfers", "Flexible schedules", "Low overhead"] }
];

const FAQ_PREVIEW = [
  { q: "What is Trovia?", a: "A decentralized marketplace for AI agents with wallet activation and on-chain marketplace records." },
  { q: "How do I activate an agent?", a: "Connect MetaMask, switch to HeLa, approve HLUSD when needed, then activate the selected agent." },
  { q: "What is HLUSD?", a: "HLUSD is the payment token used for agent activation on HeLa testnet." }
];

const ROADMAP_PREVIEW = [
  { phase: "Q2 2026", items: ["HeLa testnet launch", "6 initial agents", "Wallet integration", "Marketplace release"] },
  { phase: "Q3 2026", items: ["Mainnet deployment", "Expanded catalog", "Analytics improvements", "Community governance"] },
  { phase: "Q4 2026", items: ["Mobile support", "API integrations", "Backtesting tools", "Enterprise features"] }
];

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

      <section ref={heroRef} className="relative min-h-screen overflow-hidden border-b border-white/12 pt-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-20 h-96 w-96 animate-pulse rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-20 right-1/3 h-96 w-96 animate-pulse rounded-full bg-white/5 blur-3xl" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="absolute left-8 top-12 select-none text-6xl font-thin text-white/20">[</div>
        <div className="absolute right-8 top-12 select-none text-6xl font-thin text-white/20">]</div>

        <div className="relative flex min-h-screen flex-col items-center justify-center">
          <h1 className="mb-8 select-none font-headline text-[14vw] leading-none text-white animate-[fadeInUp_0.8s_ease-out]">
            TROVIA
          </h1>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="max-w-4xl text-center font-headline text-4xl tracking-tight text-white animate-[fadeInUp_0.8s_ease-out_0.2s_both] md:text-6xl">
              BRINGING AI AGENTS ON-CHAIN
            </h2>
            <div className="flex flex-col items-center gap-4 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
              <Link
                href="/marketplace"
                className="flex items-center gap-4 border border-primary bg-primary px-12 py-4 font-headline text-2xl uppercase text-black transition-all duration-300 hover:bg-black hover:text-primary hover:shadow-lg hover:shadow-primary/50"
              >
                [ START NOW ↗ ]
              </Link>
              <div className="font-mono text-xs tracking-[0.5em] text-white/30">[ ░░░░░░░░░░ ]</div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-10">
          <div className="flex h-[800px] w-[800px] items-center justify-center rounded-full border border-white">
            <div className="h-[600px] w-[600px] rotate-45 rounded-full border border-white"></div>
            <div className="h-[600px] w-[600px] -rotate-45 rounded-full border border-white"></div>
          </div>
        </div>

        <div className="absolute bottom-12 right-8 flex min-w-[240px] flex-col gap-2 bg-white p-6 text-black transition-all duration-300 hover:shadow-lg hover:shadow-white/20">
          <div className="flex items-center gap-2 font-mono font-bold uppercase">
            <span className="text-xl">⬡</span> HeLa Chain
          </div>
          <p className="text-xs font-bold uppercase opacity-60">L1 Optimized for Autonomous Logic</p>
          <Link href="/publish" className="mt-2 inline-block self-start border-b border-black font-headline text-lg transition-opacity hover:opacity-70">
            [ DEPLOY YOUR AGENT ↗ ]
          </Link>
        </div>
      </section>

      <section ref={howItWorksRef} className="relative grid grid-cols-1 border-b border-white/12 bg-black md:grid-cols-3">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
        </div>

        {HOW_IT_WORKS.map((item, idx) => (
          <div
            key={item.number}
            className={`group relative flex flex-col gap-8 p-12 transition-all duration-300 hover:bg-white/5 ${
              idx < 2 ? "border-b border-white/12 md:border-b-0 md:border-r" : ""
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative z-10 font-headline text-4xl text-white">[ {item.number} ↗ ]</div>
            <div className="relative z-10">
              <h3 className="mb-4 font-headline text-3xl uppercase text-white">{item.title}</h3>
              <p className="font-body text-sm uppercase leading-relaxed text-white/60">{item.description}</p>
            </div>
            <Link href={item.link} className="relative z-10 font-mono text-xs uppercase text-white/40 hover:text-white">
              [ {item.linkText} ↗ ]
            </Link>
          </div>
        ))}
      </section>

      <section ref={aboutRef} className="border-b border-white/12 bg-black px-8 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm uppercase opacity-60">[ ABOUT ]</span>
          <h2 className="mt-4 font-headline text-5xl font-bold text-white">Decentralized AI Agent Marketplace</h2>
          <div className="mb-12 mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="group border border-white/20 p-8 transition-all duration-300 hover:border-white/60 hover:bg-white/5">
              <h3 className="mb-4 font-headline text-2xl font-bold">Mission</h3>
              <p className="font-body text-sm opacity-80 transition-opacity group-hover:opacity-100">
                Give users on-chain access to practical autonomous agents for finance, operations, and workflow automation with transparent activation and execution records.
              </p>
            </div>
            <div className="group border border-white/20 p-8 transition-all duration-300 hover:border-white/60 hover:bg-white/5">
              <h3 className="mb-4 font-headline text-2xl font-bold">Vision</h3>
              <p className="font-body text-sm opacity-80 transition-opacity group-hover:opacity-100">
                Build a marketplace where agent utility, payment, and accountability all live on-chain instead of being hidden behind centralized platforms.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: "Decentralization", desc: "No central authority. Wallet-first access and open registry discovery." },
              { title: "Transparency", desc: "Activation and execution records are designed to be visible and auditable." },
              { title: "Security", desc: "Smart contract payment flow keeps activation logic predictable and explicit." }
            ].map((value) => (
              <div key={value.title} className="group border border-white/20 p-6 transition-all duration-300 hover:border-white/60 hover:bg-white/5">
                <h3 className="mb-2 text-lg font-bold">{value.title}</h3>
                <p className="font-body text-sm opacity-70 transition-opacity group-hover:opacity-90">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={pricingRef} className="relative overflow-hidden border-b border-white/12 bg-black px-8 py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-1/4 left-0 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <span className="text-sm uppercase opacity-60">[ PRICING ]</span>
          <h2 className="mb-12 mt-4 font-headline text-5xl font-bold text-white">Agent Pricing Preview</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRICING_PREVIEW.map((agent) => (
              <div key={agent.name} className="group relative border border-white/20 p-6 transition-all duration-300 hover:border-white/60 hover:bg-white/5">
                <div className="pointer-events-none absolute inset-0 rounded bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <h3 className="relative z-10 mb-2 text-lg font-bold">{agent.name}</h3>
                <div className="relative z-10 mb-4">
                  <span className="text-2xl font-bold">{agent.price}</span>
                </div>
                <ul className="relative z-10 mb-4 space-y-2">
                  {agent.features.map((feature) => (
                    <li key={feature} className="font-body text-sm opacity-70">
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className="relative z-10 text-sm text-white hover:opacity-60">
                  [ VIEW PRICING ] →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={faqRef} className="border-b border-white/12 bg-black px-8 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm uppercase opacity-60">[ FAQ ]</span>
          <h2 className="mb-12 mt-4 font-headline text-5xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_PREVIEW.map((faq) => (
              <div key={faq.q} className="group border border-white/20 p-4 transition-all duration-300 hover:border-white/60 hover:bg-white/5">
                <h3 className="mb-2 font-bold">{faq.q}</h3>
                <p className="font-body text-sm opacity-70 transition-opacity group-hover:opacity-90">{faq.a}</p>
              </div>
            ))}
            <Link href="/faq" className="mt-4 block text-sm text-white hover:opacity-60">
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      <section ref={roadmapRef} className="border-b border-white/12 bg-black px-8 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm uppercase opacity-60">[ ROADMAP ]</span>
          <h2 className="mb-12 mt-4 font-headline text-5xl font-bold text-white">Product Roadmap</h2>
          <div className="space-y-6">
            {ROADMAP_PREVIEW.map((phase) => (
              <div key={phase.phase} className="group border border-white/20 p-6 transition-all duration-300 hover:border-white/60 hover:bg-white/5">
                <h3 className="mb-4 text-lg font-bold">{phase.phase}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="font-body text-sm opacity-70 transition-opacity group-hover:opacity-90">
                      → {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={statsRef} className="relative overflow-hidden border-b border-white/12 bg-white px-8 py-20 text-black">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/5 to-transparent"></div>
        <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-0">
          {[
            { number: "6", label: "Agent Types" },
            { number: "100%", label: "On-Chain" },
            { number: "HLUSD", label: "Stable Gas" },
            { number: "666888", label: "Chain ID" }
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className={`group flex flex-col items-center px-8 md:items-start ${idx < 3 ? "md:border-r border-black/10" : ""}`}
            >
              <div className="font-headline text-[96px] uppercase leading-none transition-transform duration-300 group-hover:scale-110">
                {stat.number}
              </div>
              <div className="font-mono text-sm font-bold uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={developerRef} className="relative overflow-hidden border-t border-white/12 bg-black p-8 md:p-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-headline text-[25vw] uppercase text-white/5">
          BUILD
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="border border-white/20 px-6 py-2 font-headline text-4xl text-white transition-all duration-300 hover:border-white/60 hover:bg-white/5 md:text-5xl">
            [ FOR DEVELOPERS ↗ ]
          </div>
          <h2 className="max-w-5xl font-headline text-6xl uppercase text-white md:text-8xl">
            BUILD AGENTS. EARN HLUSD.
          </h2>
          <div className="mt-8 flex flex-col gap-6 md:flex-row">
            <Link
              href="/publish"
              className="border border-white bg-white px-12 py-4 font-headline text-2xl uppercase text-black transition-all duration-300 hover:bg-black hover:text-white hover:shadow-lg hover:shadow-white/20"
            >
              [ PUBLISH ↗ ]
            </Link>
            <Link
              href="/marketplace"
              className="border border-white bg-transparent px-12 py-4 font-headline text-2xl uppercase text-white transition-all duration-300 hover:bg-white hover:text-black hover:shadow-lg hover:shadow-white/20"
            >
              [ LEARN MORE ↗ ]
            </Link>
          </div>
        </div>
      </section>

      <footer ref={footerRef} className="border-t border-white/12 bg-black px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-bold">PRODUCT</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link href="/marketplace">Marketplace</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/publish">Publish</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">COMPANY</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/roadmap">Roadmap</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">SUPPORT</h3>
              <ul className="space-y-2 text-sm opacity-60">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">LEGAL</h3>
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
