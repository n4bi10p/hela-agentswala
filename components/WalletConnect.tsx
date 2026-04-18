"use client";

import { useState } from "react";

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } else {
        alert("Please install MetaMask");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress(null);
  };

  return (
    <button
      onClick={isConnected ? handleDisconnect : handleConnect}
      className="font-mono text-xs hover:bg-white hover:text-black transition-colors duration-150 px-4 py-2 border border-white/20 bracket-btn"
    >
      {isConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "CONNECT WALLET"}
    </button>
  );
}
