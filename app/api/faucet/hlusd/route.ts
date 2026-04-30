import { Contract, JsonRpcProvider, Wallet, isAddress, parseUnits } from "ethers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const HLUSD_ABI = [
  "function mint(address to, uint256 amount)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const DEFAULT_CLAIM_AMOUNT = "25";
const DEFAULT_MAX_CLAIM_AMOUNT = 100;
const DEFAULT_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const lastClaimAtByAddress = new Map<string, number>();

type ClaimBody = {
  address?: string;
  amount?: string;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown error";
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function parseMaxClaimAmount(): number {
  const configured = Number(process.env.HLUSD_FAUCET_MAX_CLAIM_AMOUNT || DEFAULT_MAX_CLAIM_AMOUNT);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_MAX_CLAIM_AMOUNT;
  }
  return configured;
}

function parseCooldownMs(): number {
  const configured = Number(process.env.HLUSD_FAUCET_COOLDOWN_MS || DEFAULT_COOLDOWN_MS);
  if (!Number.isFinite(configured) || configured < 0) {
    return DEFAULT_COOLDOWN_MS;
  }
  return configured;
}

function parseClaimAmount(input: string | undefined, maxClaimAmount: number): string {
  const normalized = (input || process.env.HLUSD_FAUCET_CLAIM_AMOUNT || DEFAULT_CLAIM_AMOUNT).trim();
  const numeric = Number(normalized);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Claim amount must be a positive number");
  }

  if (numeric > maxClaimAmount) {
    throw new Error(`Claim amount exceeds max faucet amount (${maxClaimAmount})`);
  }

  return normalized;
}

function getPrivateKey(): string {
  const raw = process.env.HELA_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!raw) {
    throw new Error("Missing HELA_PRIVATE_KEY or PRIVATE_KEY");
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Missing HELA_PRIVATE_KEY or PRIVATE_KEY");
  }

  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ClaimBody;
    const recipient = body.address?.trim();

    if (!recipient || !isAddress(recipient)) {
      return NextResponse.json({ error: "A valid recipient wallet address is required." }, { status: 400 });
    }

    const maxClaimAmount = parseMaxClaimAmount();
    const claimAmount = parseClaimAmount(body.amount, maxClaimAmount);
    const cooldownMs = parseCooldownMs();

    const normalizedRecipient = recipient.toLowerCase();
    const now = Date.now();
    const lastClaimAt = lastClaimAtByAddress.get(normalizedRecipient);

    if (lastClaimAt && cooldownMs > 0 && now - lastClaimAt < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastClaimAt);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return NextResponse.json(
        {
          error: `This wallet is on cooldown. Try again in ${remainingSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_HELA_RPC || requireEnv("HELA_RPC_URL");
    const hlusdAddress = process.env.HLUSD_ADDRESS || process.env.NEXT_PUBLIC_HLUSD_ADDRESS;

    if (!hlusdAddress || !isAddress(hlusdAddress)) {
      throw new Error("Missing valid HLUSD_ADDRESS or NEXT_PUBLIC_HLUSD_ADDRESS");
    }

    const privateKey = getPrivateKey();
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);
    const token = new Contract(hlusdAddress, HLUSD_ABI, signer);

    const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);
    const tx = await token.mint(recipient, parseUnits(claimAmount, Number(decimals)));
    const receipt = await tx.wait();

    lastClaimAtByAddress.set(normalizedRecipient, now);

    return NextResponse.json(
      {
        ok: true,
        recipient,
        amount: claimAmount,
        symbol,
        txHash: receipt?.hash || tx.hash
      },
      { status: 200 }
    );
  } catch (error) {
    const message = toErrorMessage(error);

    if (/not owner/i.test(message)) {
      return NextResponse.json(
        {
          error: "Faucet mint failed: server wallet is not the HLUSD owner. Use the owner wallet to mint."
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
