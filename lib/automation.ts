import { Contract, JsonRpcProvider, Wallet, parseUnits } from "ethers";
import { getExecutorContract } from "./contracts";
import { appendExecutionLog, getStoredAgent, listDueJobs, updateAgentJob } from "./automationStore";
import { runAgent } from "./agentRunner";
import type { AgentJob, AutomationFrequency, ExecutionResult } from "../types/agent";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function addFrequency(from: Date, frequency: AutomationFrequency) {
  const next = new Date(from);

  if (frequency === "hourly") {
    next.setHours(next.getHours() + 1);
  } else if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }

  return next;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown automation error";
}

async function logExecutionOnChain(job: AgentJob, result: ExecutionResult) {
  const rpcUrl = requireEnv("NEXT_PUBLIC_HELA_RPC");
  const privateKey = requireEnv("HELA_PRIVATE_KEY");

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);

  const executorReadContract = await getExecutorContract(false);
  const executorContract = executorReadContract.connect(signer);
  const logExecution = executorContract.getFunction("logExecution");
  const tx = await logExecution(job.agentId, job.ownerAddress, "automation_run", result.result);
  const receipt = await tx.wait();
  return receipt?.hash || tx.hash;
}

async function executeSchedulingTransfer(job: AgentJob) {
  const storedAgent = getStoredAgent(job.agentId);
  if (!storedAgent) {
    throw new Error("Stored agent not found");
  }

  const recipient = String(job.userConfig.recipient || job.userConfig.recipientAddress || "");
  const amountValue = job.userConfig.amount || job.userConfig.stipendAmountHLUSD;
  const amount = typeof amountValue === "number" ? String(amountValue) : String(amountValue || "");

  if (!recipient) {
    throw new Error("Scheduling job missing recipient");
  }
  if (!amount || Number(amount) <= 0) {
    throw new Error("Scheduling job missing amount");
  }

  const rpcUrl = requireEnv("NEXT_PUBLIC_HELA_RPC");
  const hlusdAddress = requireEnv("NEXT_PUBLIC_HLUSD_ADDRESS");

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(storedAgent.agentWalletPrivateKey, provider);
  const token = new Contract(hlusdAddress, ERC20_ABI, signer);

  const tx = await token.transfer(recipient, parseUnits(amount, 18));
  const receipt = await tx.wait();

  return {
    success: true,
    result: `Transferred ${amount} HLUSD to ${recipient}`,
    data: {
      recipient,
      amount
    },
    txHash: receipt?.hash || tx.hash,
    executedAt: new Date().toISOString()
  } satisfies ExecutionResult;
}

async function executeJob(job: AgentJob) {
  const storedAgent = getStoredAgent(job.agentId);
  if (!storedAgent) {
    throw new Error("Stored agent not found");
  }

  if (storedAgent.agent.agentType === "scheduling") {
    return executeSchedulingTransfer(job);
  }

  return runAgent(job.agentId, job.userConfig);
}

export async function processJob(job: AgentJob) {
  const startedAt = new Date();

  try {
    const result = await executeJob(job);
    const executionLogTxHash = await logExecutionOnChain(job, result).catch(() => result.txHash);
    const nextRunAt = addFrequency(startedAt, job.frequency).toISOString();

    updateAgentJob(job.id, (current) => ({
      ...current,
      status: "active",
      nextRunAt,
      lastRunAt: startedAt.toISOString(),
      lastResult: result.result,
      lastError: undefined,
      lastExecutionTxHash: executionLogTxHash || result.txHash
    }));

    appendExecutionLog({
      agentId: job.agentId,
      ownerAddress: job.ownerAddress,
      jobId: job.id,
      success: result.success,
      result: result.result,
      txHash: executionLogTxHash || result.txHash,
      executedAt: result.executedAt
    });

    return {
      jobId: job.id,
      success: true,
      result
    };
  } catch (error) {
    const message = toErrorMessage(error);

    updateAgentJob(job.id, (current) => ({
      ...current,
      status: "error",
      lastRunAt: startedAt.toISOString(),
      lastError: message
    }));

    appendExecutionLog({
      agentId: job.agentId,
      ownerAddress: job.ownerAddress,
      jobId: job.id,
      success: false,
      result: message,
      executedAt: startedAt.toISOString()
    });

    return {
      jobId: job.id,
      success: false,
      error: message
    };
  }
}

export async function processDueJobs(referenceTime = new Date().toISOString()) {
  const dueJobs = listDueJobs(referenceTime);
  const results = [];

  for (const job of dueJobs) {
    results.push(await processJob(job));
  }

  return results;
}
