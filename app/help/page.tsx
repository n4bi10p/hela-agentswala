'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function HelpPage() {
  const guides = [
    {
      title: "Getting Started",
      desc: "Connect your wallet and explore the agent marketplace",
      items: ["Connect MetaMask", "Switch to HeLa testnet", "Browse agents"]
    },
    {
      title: "Activating Agents",
      desc: "How to activate and configure AI agents",
      items: ["Select an agent", "Configure parameters", "Approve payment", "Monitor execution"]
    },
    {
      title: "Managing Your Dashboard",
      desc: "Track your active agents and execution history",
      items: ["View active agents", "Check execution logs", "Edit configurations", "Deactivate agents"]
    },
    {
      title: "Publishing Your Agent",
      desc: "List your own AI agent on the marketplace",
      items: ["Complete the form", "Define config schema", "Set pricing", "Submit for review"]
    },
    {
      title: "Troubleshooting",
      desc: "Solutions to common issues",
      items: ["Wallet connection", "Network switching", "Transaction errors", "Agent failures"]
    },
    {
      title: "Security Best Practices",
      desc: "Keep your funds and data safe",
      items: ["Never share private keys", "Verify contracts", "Use testnet first", "Enable 2FA"]
    }
  ];

  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ HELP CENTER ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-8">Help Center</h1>
          <p className="font-body text-lg opacity-80 mb-12">Learn how to use Trovia and get the most out of AI agents.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {guides.map((guide, idx) => (
              <div key={idx} className="border border-white/20 p-6 hover:border-white/40 transition-colors">
                <h3 className="font-bold text-lg text-white mb-2">{guide.title}</h3>
                <p className="font-body text-xs opacity-60 mb-4">{guide.desc}</p>
                <ul className="space-y-2">
                  {guide.items.map((item, i) => (
                    <li key={i} className="font-body text-sm opacity-70 flex items-center">
                      <span className="mr-2">→</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border border-white/20 p-8 mb-12">
            <h2 className="font-bold text-2xl mb-6">Common Issues & Solutions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-white mb-2">MetaMask Not Connecting?</h3>
                <p className="font-body text-sm opacity-70">
                  Make sure MetaMask is installed and unlocked. Refresh the page and try again. Clear browser cache if issues persist.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Wrong Network?</h3>
                <p className="font-body text-sm opacity-70">
                  Click [CONNECT WALLET] to see a prompt to switch to HeLa testnet. Approve the network addition in MetaMask.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Agent Not Executing?</h3>
                <p className="font-body text-sm opacity-70">
                  Check your HLUSD balance. Some agents have minimum requirements. View execution logs for error details.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">High Gas Fees?</h3>
                <p className="font-body text-sm opacity-70">
                  HeLa testnet has minimal fees. If fees seem high, check you're on the correct network (Chain ID 8668).
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Transaction Stuck?</h3>
                <p className="font-body text-sm opacity-70">
                  Wait 5-10 minutes for confirmation. If still pending, you may need to replace the transaction in MetaMask.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="font-body text-sm opacity-60 mb-4">Can't find what you're looking for?</p>
            <Link href="/contact" className="text-white hover:opacity-60 transition">
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
