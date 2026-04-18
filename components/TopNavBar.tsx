"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

export function TopNavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  return (
    <nav className="bg-black text-white font-body text-sm tracking-tight fixed top-0 left-0 w-full z-50 border-b border-white/12 flex justify-between items-center px-8 py-4">
      <Link href="/" className="font-mono text-lg font-bold leading-none flex flex-col text-white">
        <span className="text-xs opacity-60">DECENTRALIZED</span>
        <span className="font-headline text-xl tracking-wider">TROVIA</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 uppercase font-bold">
        <Link
          href="/marketplace"
          className={`pb-1 transition-all duration-75 ${
            isActive("/marketplace")
              ? "text-white border-b-2 border-white hover:opacity-80"
              : "text-white/60 hover:text-white hover:opacity-80"
          }`}
        >
          [ MARKETPLACE ]
        </Link>
        <Link
          href="/dashboard"
          className={`pb-1 transition-all duration-75 ${
            isActive("/dashboard")
              ? "text-white border-b-2 border-white hover:opacity-80"
              : "text-white/60 hover:text-white hover:opacity-80"
          }`}
        >
          [ DASHBOARD ]
        </Link>
        <Link
          href="/publish"
          className={`pb-1 transition-all duration-75 ${
            isActive("/publish")
              ? "text-white border-b-2 border-white hover:opacity-80"
              : "text-white/60 hover:text-white hover:opacity-80"
          }`}
        >
          [ PUBLISH ]
        </Link>
      </div>

      <WalletConnect />
    </nav>
  );
}
