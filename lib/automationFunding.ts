import type { AgentJob } from "../types/agent";
import { fetchHLUSDBalanceForAddress, fetchNativeBalanceForAddress } from "./contracts";

export type FundingStatus = "empty" | "low" | "funded" | "unknown";
export type GasFundingStatus = "missing" | "low" | "ready" | "unknown";

export type FundingSnapshot = {
  balanceHLUSD: string | null;
  balanceValue: number | null;
  nativeBalanceHELA: string | null;
  nativeBalanceValue: number | null;
  recommendedMinimumHLUSD: string | null;
  gasFundingStatus: GasFundingStatus;
  gasHint: string;
  fundingStatus: FundingStatus;
  fundingHint: string;
};

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRecommendedMinimum(job: AgentJob, agentType: string | null): number | null {
  if (agentType === "content" || agentType === "business") {
    return 0;
  }

  if (agentType === "trading" || agentType === "farming" || agentType === "rebalancing") {
    return 0;
  }

  if (agentType === "scheduling") {
    const rawAmount = job.userConfig.amount ?? job.userConfig.stipendAmountHLUSD;
    const parsed = Number(rawAmount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  return 0;
}

function toDisplayAmount(value: number | null) {
  if (value === null) {
    return null;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const MIN_NATIVE_GAS_BALANCE = 0.0001;

export async function getFundingSnapshot(
  agentWalletAddress: string | null,
  job: AgentJob,
  agentType: string | null = null
): Promise<FundingSnapshot> {
  if (!agentWalletAddress) {
    return {
      balanceHLUSD: null,
      balanceValue: null,
      nativeBalanceHELA: null,
      nativeBalanceValue: null,
      recommendedMinimumHLUSD: toDisplayAmount(getRecommendedMinimum(job, agentType)),
      gasFundingStatus: "unknown",
      gasHint: "Agent wallet address is unavailable.",
      fundingStatus: "unknown",
      fundingHint: "Agent wallet address is unavailable."
    };
  }

  try {
    const [balanceHLUSD, nativeBalanceHELA] = await Promise.all([
      fetchHLUSDBalanceForAddress(agentWalletAddress),
      fetchNativeBalanceForAddress(agentWalletAddress)
    ]);
    const balanceValue = toNumber(balanceHLUSD);
    const nativeBalanceValue = toNumber(nativeBalanceHELA);
    const recommendedMinimum = getRecommendedMinimum(job, agentType);

    if (balanceValue === null || nativeBalanceValue === null) {
      return {
        balanceHLUSD,
        balanceValue,
        nativeBalanceHELA,
        nativeBalanceValue,
        recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
        gasFundingStatus: "unknown",
        gasHint: "Wallet gas balance could not be parsed.",
        fundingStatus: "unknown",
        fundingHint: "Wallet balances could not be parsed."
      };
    }

    if ((recommendedMinimum ?? 0) <= 0) {
      return {
        balanceHLUSD,
        balanceValue,
        nativeBalanceHELA,
        nativeBalanceValue,
        recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
        gasFundingStatus: "ready",
        gasHint: "This agent does not require wallet funding for automation runs.",
        fundingStatus: "funded",
        fundingHint: "This agent can run without HLUSD or agent-wallet gas funding."
      };
    }

    if (balanceValue <= 0) {
      return {
        balanceHLUSD,
        balanceValue,
        nativeBalanceHELA,
        nativeBalanceValue,
        recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
        gasFundingStatus:
          nativeBalanceValue <= 0 ? "missing" : nativeBalanceValue < MIN_NATIVE_GAS_BALANCE ? "low" : "ready",
        gasHint:
          nativeBalanceValue <= 0
            ? "Add native gas to the agent wallet so it can pay transaction fees."
            : nativeBalanceValue < MIN_NATIVE_GAS_BALANCE
              ? "Top up a small amount of native gas so the wallet can pay transaction fees."
              : "Agent wallet has enough native gas for execution.",
        fundingStatus: "empty",
        fundingHint: "Fund this agent wallet with HLUSD before automation can run."
      };
    }

    if (recommendedMinimum !== null && balanceValue < recommendedMinimum) {
      return {
        balanceHLUSD,
        balanceValue,
        nativeBalanceHELA,
        nativeBalanceValue,
        recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
        gasFundingStatus:
          nativeBalanceValue <= 0 ? "missing" : nativeBalanceValue < MIN_NATIVE_GAS_BALANCE ? "low" : "ready",
        gasHint:
          nativeBalanceValue <= 0
            ? "Add native gas to the agent wallet so it can pay transaction fees."
            : nativeBalanceValue < MIN_NATIVE_GAS_BALANCE
              ? "Top up a small amount of native gas so the wallet can pay transaction fees."
              : "Agent wallet has enough native gas for execution.",
        fundingStatus: "low",
        fundingHint: `Current balance is below the recommended ${toDisplayAmount(recommendedMinimum)} HLUSD minimum for reliable runs.`
      };
    }

    if (nativeBalanceValue <= 0) {
      return {
        balanceHLUSD,
        balanceValue,
        nativeBalanceHELA,
        nativeBalanceValue,
        recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
        gasFundingStatus: "missing",
        gasHint: "Add native gas to the agent wallet so it can pay transaction fees.",
        fundingStatus: "low",
        fundingHint: "Agent wallet has enough HLUSD, but no native gas for transaction fees."
      };
    }

    if (nativeBalanceValue < MIN_NATIVE_GAS_BALANCE) {
      return {
        balanceHLUSD,
        balanceValue,
        nativeBalanceHELA,
        nativeBalanceValue,
        recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
        gasFundingStatus: "low",
        gasHint: "Top up a small amount of native gas so the wallet can pay transaction fees.",
        fundingStatus: "low",
        fundingHint: "Agent wallet has enough HLUSD, but native gas is low for reliable execution."
      };
    }

    return {
      balanceHLUSD,
      balanceValue,
      nativeBalanceHELA,
      nativeBalanceValue,
      recommendedMinimumHLUSD: toDisplayAmount(recommendedMinimum),
      gasFundingStatus: "ready",
      gasHint: "Agent wallet has enough native gas for execution.",
      fundingStatus: "funded",
      fundingHint: "Agent wallet has enough HLUSD and native gas for the next automation run."
    };
  } catch {
    return {
      balanceHLUSD: null,
      balanceValue: null,
      nativeBalanceHELA: null,
      nativeBalanceValue: null,
      recommendedMinimumHLUSD: toDisplayAmount(getRecommendedMinimum(job, agentType)),
      gasFundingStatus: "unknown",
      gasHint: "Could not fetch the native gas balance for this agent wallet.",
      fundingStatus: "unknown",
      fundingHint: "Could not fetch the HLUSD balance for this agent wallet."
    };
  }
}
