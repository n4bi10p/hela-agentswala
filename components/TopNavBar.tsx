"use client";

import Link from "next/link";
import { WalletConnect } from "./WalletConnect";

export function TopNavBar() {
  return (
    <nav className="bg-black text-white font-body text-sm tracking-tight fixed top-0 left-0 w-full z-50 border-b border-white/12 flex justify-between items-center px-8 py-4">
      <Link href="/" className="font-mono text-lg font-bold leading-none flex flex-col text-white">
        <span className="text-xs opacity-60">DECENTRALIZED</span>
        <span className="font-headline text-xl tracking-wider">TROVIA</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 uppercase font-bold">
        <Link
          href="/marketplace"
          className="text-white border-b-2 border-white pb-1 hover:opacity-80 transition-opacity"
        >
          [ MARKETPLACE ]
        </Link>
        <Link
          href="/dashboard"
          className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-75 pb-1"
        >
          [ DASHBOARD ]
        </Link>
        <Link
          href="/publish"
          className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-75 pb-1"
        >
          [ PUBLISH ]
        </Link>
      </div>

      <WalletConnect />
    </nav>
  );
}
