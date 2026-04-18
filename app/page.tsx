import Link from "next/link";
import { TopNavBar } from "@/components/TopNavBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center border-b border-white/12 pt-24">
        {/* Corner Brackets */}
        <div className="absolute top-12 left-8 text-6xl font-thin text-white/20 select-none">
          [
        </div>
        <div className="absolute top-12 right-8 text-6xl font-thin text-white/20 select-none">
          ]
        </div>

        <h1 className="font-headline text-[14vw] leading-none text-white whitespace-nowrap opacity-100 mb-8 select-none">
          TROVIA
        </h1>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="font-headline text-4xl md:text-6xl text-center max-w-4xl tracking-tight text-white">
            BRINGING AI AGENTS ON-CHAIN
          </h2>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/marketplace"
              className="bg-primary text-black px-12 py-4 font-headline text-2xl hover:bg-black hover:text-primary border border-primary transition-colors flex items-center gap-4 uppercase"
            >
              [ START NOW ↗ ]
            </Link>
            <div className="font-mono text-white/30 text-xs tracking-[0.5em]">
              [ ░░░░░░░░░░ ]
            </div>
          </div>
        </div>

        {/* Wireframe Sphere Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center overflow-hidden">
          <div className="w-[800px] h-[800px] border border-white rounded-full flex items-center justify-center">
            <div className="w-[600px] h-[600px] border border-white rounded-full rotate-45"></div>
            <div className="w-[600px] h-[600px] border border-white rounded-full -rotate-45"></div>
          </div>
        </div>

        {/* Bottom Right Card */}
        <div className="absolute bottom-12 right-8 bg-white text-black p-6 flex flex-col gap-2 min-w-[240px]">
          <div className="flex items-center gap-2 font-mono font-bold uppercase">
            <span className="text-xl">⬡</span> HeLa Chain
          </div>
          <p className="text-xs uppercase font-bold opacity-60">
            L1 Optimized for Autonomous Logic
          </p>
          <Link
            href="/publish"
            className="mt-2 font-headline text-lg border-b border-black inline-block self-start hover:opacity-70"
          >
            [ DEPLOY YOUR AGENT ↗ ]
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-white/12 bg-black">
        {[
          {
            number: "01",
            title: "BROWSE",
            description:
              "Access the repository of pre-trained, on-chain autonomous entities specialized in DeFi, Data mining, and Social orchestrations.",
            link: "/marketplace",
            linkText: "EXPLORE AGENTS",
          },
          {
            number: "02",
            title: "ACTIVATE",
            description:
              "Stake HLUSD to fund your agent's compute budget. Immutable contracts ensure execution remains persistent and verifiable.",
            link: "/marketplace",
            linkText: "STAKE & DEPLOY",
          },
          {
            number: "03",
            title: "RUNS FOR YOU",
            description:
              "Your agent executes 24/7 on the HeLa network, delivering results directly to your wallet via cross-chain messaging.",
            link: "/dashboard",
            linkText: "VIEW DASHBOARD",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-12 flex flex-col gap-8 ${
              idx < 2 ? "border-b md:border-b-0 md:border-r" : ""
            } border-white/12`}
          >
            <div className="font-headline text-4xl text-white">
              [ {item.number} ↗ ]
            </div>
            <div>
              <h3 className="font-headline text-3xl mb-4 text-white uppercase">
                {item.title}
              </h3>
              <p className="text-white/60 font-body text-sm leading-relaxed uppercase">
                {item.description}
              </p>
            </div>
            <Link
              href={item.link}
              className="font-mono text-xs text-white/40 hover:text-white uppercase"
            >
              [ {item.linkText} ↗ ]
            </Link>
          </div>
        ))}
      </section>

      {/* Stats Section */}
      <section className="bg-white text-black py-20 px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-0">
          {[
            { number: "6", label: "Agent Types" },
            { number: "100%", label: "On-Chain" },
            { number: "HLUSD", label: "Stable Gas" },
            { number: "666888", label: "Chain ID" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center md:items-start ${
                idx < 3 ? "md:border-r" : ""
              } border-black/10 px-8`}
            >
              <div className="font-headline text-[96px] leading-none uppercase">
                {stat.number}
              </div>
              <div className="font-mono text-sm font-bold uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Developer CTA Section */}
      <section className="p-8 md:p-24 bg-black border-t border-white/12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-headline text-[25vw] text-white/5 pointer-events-none select-none uppercase">
          BUILD
        </div>

        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          <div className="font-headline text-4xl md:text-5xl border border-white/20 px-6 py-2 text-white">
            [ FOR DEVELOPERS ↗ ]
          </div>
          <h2 className="font-headline text-6xl md:text-8xl max-w-5xl text-white uppercase">
            BUILD AGENTS. EARN HLUSD.
          </h2>

          <div className="flex flex-col md:flex-row gap-6 mt-8">
            <Link
              href="/publish"
              className="bg-white text-black px-12 py-4 font-headline text-2xl hover:bg-black hover:text-white border border-white transition-colors uppercase"
            >
              [ PUBLISH ↗ ]
            </Link>
            <Link
              href="/marketplace"
              className="bg-transparent text-white px-12 py-4 font-headline text-2xl border border-white hover:bg-white hover:text-black transition-colors uppercase"
            >
              [ LEARN MORE ↗ ]
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
