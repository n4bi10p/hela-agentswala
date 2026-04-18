"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

export function TopNavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  const navLinks = [
    { label: "HOME", href: "/" },
    { label: "MARKETPLACE", href: "/marketplace" },
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "PUBLISH", href: "/publish" },
    { label: "ABOUT", href: "/about" },
    { label: "PRICING", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
    { label: "ROADMAP", href: "/roadmap" },
  ];

  return (
    <nav className="bg-black text-white font-body text-sm tracking-tight fixed top-0 left-0 w-full z-50 border-b border-white/12 flex justify-between items-center px-8 py-4">
      <Link href="/" className="font-mono text-lg font-bold leading-none flex flex-col text-white">
        <span className="text-xs opacity-60">DECENTRALIZED</span>
        <span className="font-headline text-xl tracking-wider">TROVIA</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 uppercase font-bold text-xs">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`pb-1 transition-all duration-75 ${
              isActive(link.href)
                ? "text-white border-b-2 border-white hover:opacity-80"
                : "text-white/60 hover:text-white hover:opacity-80"
            }`}
          >
            [ {link.label} ]
          </Link>
        ))}
      </div>

      <WalletConnect />
    </nav>
  );
}
