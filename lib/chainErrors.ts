export type ChainErrorCode =
  | "wallet_not_found"
  | "user_rejected"
  | "chain_not_added"
  | "wrong_network"
  | "insufficient_funds"
  | "rpc_error"
  | "missing_env"
  | "invalid_input"
  | "unknown";

export class ChainIntegrationError extends Error {
  code: ChainErrorCode;
  details?: string;

  constructor(code: ChainErrorCode, message: string, details?: string) {
    super(message);
    this.name = "ChainIntegrationError";
    this.code = code;
    this.details = details;
  }
}

function pushString(target: string[], value: unknown) {
  if (typeof value !== "string") {
    return;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  if (!target.includes(trimmed)) {
    target.push(trimmed);
  }
}

function collectErrorMessages(value: unknown, target: string[], visited: WeakSet<object>, depth = 0) {
  if (depth > 5 || value == null) {
    return;
  }

  if (typeof value === "string") {
    pushString(target, value);
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  const record = value as Record<string, unknown>;
  const prioritizedKeys = [
    "shortMessage",
    "message",
    "reason",
    "details",
    "body",
    "data",
    "error",
    "info",
    "originalError",
    "cause"
  ];

  for (const key of prioritizedKeys) {
    if (key in record) {
      const nested = record[key];
      if (typeof nested === "string") {
        pushString(target, nested);
      } else {
        collectErrorMessages(nested, target, visited, depth + 1);
      }
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectErrorMessages(item, target, visited, depth + 1);
    }
  }
}

function extractErrorMessages(error: unknown): string[] {
  const messages: string[] = [];
  collectErrorMessages(error, messages, new WeakSet<object>());
  return messages;
}

function cleanChainMessage(message: string) {
  return message
    .replace(/^execution reverted(?::)?\s*/i, "")
    .replace(/^vm exception while processing transaction:\s*/i, "")
    .replace(/^transaction reverted:\s*/i, "")
    .trim();
}

export function normalizeChainError(error: unknown, fallbackMessage: string): ChainIntegrationError {
  if (error instanceof ChainIntegrationError) {
    return error;
  }

  const err = error as { code?: number; message?: string; shortMessage?: string };
  const extractedMessages = extractErrorMessages(error).map(cleanChainMessage).filter(Boolean);
  const message = extractedMessages[0] || err.shortMessage || err.message || fallbackMessage;
  const lowered = extractedMessages.join(" | ").toLowerCase() || message.toLowerCase();

  if (err.code === 4001 || lowered.includes("user rejected") || lowered.includes("rejected")) {
    return new ChainIntegrationError("user_rejected", "User rejected the wallet request", message);
  }

  if (err.code === 4902) {
    return new ChainIntegrationError("chain_not_added", "HeLa network is not added in wallet", message);
  }

  if (lowered.includes("chain") && lowered.includes("not configured")) {
    return new ChainIntegrationError("wrong_network", "Wallet is connected to the wrong network", message);
  }

  if (lowered.includes("insufficient funds")) {
    return new ChainIntegrationError("insufficient_funds", "Insufficient funds for gas or transfer", message);
  }

  if (lowered.includes("insufficient balance to pay fees")) {
    return new ChainIntegrationError(
      "insufficient_funds",
      "This wallet does not have enough native gas to submit the transaction",
      message
    );
  }

  if (lowered.includes("already activated")) {
    return new ChainIntegrationError("invalid_input", "This wallet has already activated this agent", message);
  }

  if (lowered.includes("agent inactive")) {
    return new ChainIntegrationError("invalid_input", "This agent is not live on-chain", message);
  }

  if (lowered.includes("invalid developer")) {
    return new ChainIntegrationError(
      "invalid_input",
      "This agent has an invalid developer payout address on-chain",
      message
    );
  }

  if (lowered.includes("payment failed")) {
    return new ChainIntegrationError(
      "invalid_input",
      "HLUSD payment failed. Check that this wallet has enough HLUSD and approval for the full activation amount",
      message
    );
  }

  if (lowered.includes("platform payout failed")) {
    return new ChainIntegrationError("unknown", "Platform fee payout failed during activation", message);
  }

  if (lowered.includes("developer payout failed")) {
    return new ChainIntegrationError("unknown", "Developer payout failed during activation", message);
  }

  if (lowered.includes("network") || lowered.includes("rpc") || err.code === -32603) {
    return new ChainIntegrationError(
      "rpc_error",
      extractedMessages[0] || "Blockchain network/RPC error",
      message
    );
  }

  return new ChainIntegrationError("unknown", extractedMessages[0] || fallbackMessage, message);
}
