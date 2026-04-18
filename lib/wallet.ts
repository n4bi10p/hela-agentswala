import { BrowserProvider, Contract, formatUnits } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (payload: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

const HELA_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "666888");
const HELA_CHAIN_ID_HEX = `0x${HELA_CHAIN_ID.toString(16)}`;

const ERC20_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

function getEthereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found");
  }
  return window.ethereum;
}

export async function connectWallet(): Promise<string> {
  const ethereum = getEthereum();
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts.length) {
    throw new Error("No account connected");
  }
  return accounts[0];
}

export async function getCurrentAccount(): Promise<string | null> {
  const ethereum = getEthereum();
  const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
  return accounts[0] || null;
}

export async function switchToHeLaNetwork() {
  const ethereum = getEthereum();
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HELA_CHAIN_ID_HEX }]
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HELA_CHAIN_ID_HEX,
            chainName: "HeLa Testnet",
            nativeCurrency: {
              name: "HLUSD",
              symbol: "HLUSD",
              decimals: 18
            },
            rpcUrls: [process.env.NEXT_PUBLIC_HELA_RPC || "https://testnet-rpc.helachain.com"]
          }
        ]
      });
    } else {
      throw error;
    }
  }
}

export async function ensureHeLaNetwork() {
  const ethereum = getEthereum();
  const currentChainId = (await ethereum.request({ method: "eth_chainId" })) as string;
  if (currentChainId.toLowerCase() !== HELA_CHAIN_ID_HEX.toLowerCase()) {
    await switchToHeLaNetwork();
  }
}

export async function getHLUSDBalance(address: string) {
  const token = process.env.NEXT_PUBLIC_HLUSD_ADDRESS;
  if (!token) {
    throw new Error("Missing NEXT_PUBLIC_HLUSD_ADDRESS");
  }

  const provider = new BrowserProvider(getEthereum() as never);
  const contract = new Contract(token, ERC20_ABI, provider);

  const [balance, decimals] = await Promise.all([contract.balanceOf(address), contract.decimals()]);
  return formatUnits(balance, Number(decimals));
}

export async function approveHLUSD(spender: string, amount: bigint) {
  const token = process.env.NEXT_PUBLIC_HLUSD_ADDRESS;
  if (!token) {
    throw new Error("Missing NEXT_PUBLIC_HLUSD_ADDRESS");
  }

  const provider = new BrowserProvider(getEthereum() as never);
  const signer = await provider.getSigner();
  const contract = new Contract(token, ERC20_ABI, signer);

  const tx = await contract.approve(spender, amount);
  return tx.wait();
}
