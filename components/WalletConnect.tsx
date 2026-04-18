"use client";

import { useEffect, useState } from "react";
import {
  clearConnectedAccount,
  connectWallet,
  ensureHeLaNetwork,
  getConnectedAccount,
  getPersistedConnectedAccount,
  persistConnectedAccount
} from "@/lib/wallet";

function broadcastWalletChange(address: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("trovia:wallet-changed", {
      detail: { address }
    })
  );
}

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    async function syncAccount() {
      try {
        const account = await getConnectedAccount();
        setAddress(account);
      } catch {
        const stored = getPersistedConnectedAccount();
        setAddress(stored);
      }
    }

    syncAccount();

    const handleWalletChange = async () => {
      await syncAccount();
    };

    const handleAccountsChanged = (accounts: string[]) => {
      const persisted = getPersistedConnectedAccount();
      const nextAddress = accounts[0] || null;

      if (!nextAddress) {
        clearConnectedAccount();
        setAddress(null);
        broadcastWalletChange(null);
        return;
      }

      if (!persisted) {
        setAddress(null);
        broadcastWalletChange(null);
        return;
      }

      persistConnectedAccount(nextAddress);
      setAddress(nextAddress);
      broadcastWalletChange(nextAddress);
    };

    window.addEventListener("trovia:wallet-changed", handleWalletChange as EventListener);
    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      window.removeEventListener("trovia:wallet-changed", handleWalletChange as EventListener);
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const handleConnect = async () => {
    try {
      await ensureHeLaNetwork();
      const nextAddress = await connectWallet();
      setAddress(nextAddress);
      persistConnectedAccount(nextAddress);
      broadcastWalletChange(nextAddress);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert(error instanceof Error ? error.message : "Failed to connect wallet");
    }
  };

  const handleDisconnect = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Do you really want to disconnect this wallet from Trovia?");
      if (!confirmed) {
        return;
      }
      clearConnectedAccount();
    }
    setAddress(null);
    broadcastWalletChange(null);
  };

  return (
    <button
      onClick={address ? handleDisconnect : handleConnect}
      className="font-mono text-xs hover:bg-white hover:text-black transition-colors duration-150 px-4 py-2 border border-white/20 bracket-btn"
    >
      {address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "CONNECT WALLET"}
    </button>
  );
}
