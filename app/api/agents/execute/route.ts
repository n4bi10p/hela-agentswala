<<<<<<< HEAD
/**
 * Executes deployed/generated agents by id and logs runs on-chain.
 * Exports:
 * - POST: executes runtime code using user config and optionally records execution on-chain.
 */

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getExecutorContract } from "../../../../lib/contracts";
import { getAgent, runAgent } from "../../../../lib/agentRunner";

type ExecuteRequestBody = {
  agentId?: string;
  userConfig?: Record<string, any>;
  userAddress?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown error";
}

function hasRequiredBodyFields(body: ExecuteRequestBody): body is {
  agentId: string;
  userConfig: Record<string, any>;
  userAddress: string;
} {
  return (
    typeof body.agentId === "string" &&
    body.agentId.trim().length > 0 &&
    isRecord(body.userConfig) &&
    typeof body.userAddress === "string" &&
    body.userAddress.trim().length > 0
  );
}

function ensureServerEnv(): { rpcUrl: string; privateKey: string } {
  const rpcUrl = process.env.NEXT_PUBLIC_HELA_RPC;
  const privateKey = process.env.HELA_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Server misconfigured");
  }

  // getExecutorContract(false) relies on all public contract addresses in lib/contracts.ts
  if (
    !process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ||
    !process.env.NEXT_PUBLIC_AGENT_ESCROW_ADDRESS ||
    !process.env.NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS
  ) {
    throw new Error("Server misconfigured");
  }

  return { rpcUrl, privateKey };
}

export async function POST(req: Request) {
  console.log("[EXECUTE] Received request");

  let body: ExecuteRequestBody;
  try {
    body = (await req.json()) as ExecuteRequestBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  if (!hasRequiredBodyFields(body)) {
    return NextResponse.json(
      {
        error: "agentId, userConfig, and userAddress are required"
      },
      { status: 400 }
    );
  }

  const { agentId, userConfig, userAddress } = body;

  try {
    console.log("[EXECUTE] Step 1: checking agent availability");
    const storedAgent = getAgent(agentId);
    if (!storedAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    console.log("[EXECUTE] Step 2: running agent");
    const execution = await runAgent(agentId, userConfig);

    let txHash: string | undefined;
    // Non-blocking on-chain logging; user response must not fail if this step errors.
    try {
      console.log("[EXECUTE] Step 3: logging execution on-chain");
      const { rpcUrl, privateKey } = ensureServerEnv();
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);

      const executorReadContract = await getExecutorContract(false);
      const executorContract = executorReadContract.connect(signer);
      const logExecution = executorContract.getFunction("logExecution");
      const tx = await logExecution(agentId, userAddress, "agent_run", execution.result);
      const receipt = await tx.wait();
      txHash = receipt?.hash || tx.hash;
      console.log("[EXECUTE] On-chain execution log complete", txHash);
    } catch (logError: unknown) {
      console.warn("[EXECUTE] Non-blocking on-chain log failed:", errorMessage(logError));
    }

    return NextResponse.json(
      {
        success: execution.success,
        result: execution.result,
        data: execution.data,
        txHash,
        executedAt: execution.executedAt
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = errorMessage(error);
    console.error("[EXECUTE] Error", message);

    if (message === "Agent not found") {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
=======
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, action, params } = body;

    if (!agentId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Route to appropriate agent handler
    let result;

    switch (agentId) {
      case 1: // Trading Agent
        result = await executeTradingAgent(action, params);
        break;
      case 2: // Farming Agent
        result = await executeFarmingAgent(action, params);
        break;
      case 3: // Content Reply Agent
        result = await executeContentAgent(action, params);
        break;
      case 4: // Arb Master Z
        result = await executeTradingAgent(action, params);
        break;
      case 5: // Schedule Master
        result = await executeSchedulingAgent(action, params);
        break;
      case 6: // Portfolio Rebalancer
        result = await executeRebalancingAgent(action, params);
        break;
      case 7: // Business Assistant
        result = await executeBusinessAgent(action, params);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown agent ID" },
          { status: 404 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Agent execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute agent" },
      { status: 500 }
    );
  }
}

async function executeTradingAgent(action: string, params: any) {
  // Placeholder for trading agent logic
  console.log("Executing trading agent:", action, params);
  return {
    action,
    status: "executed",
    data: {
      pair: params.pair,
      threshold: params.threshold,
      simulatedPrice: (Math.random() * 2).toFixed(4),
    },
  };
}

async function executeFarmingAgent(action: string, params: any) {
  // Placeholder for farming agent logic
  console.log("Executing farming agent:", action, params);
  return {
    action,
    status: "executed",
    data: {
      lpAddress: params.lpAddress,
      yield: `${(Math.random() * 50).toFixed(2)}%`,
      compounded: true,
    },
  };
}

async function executeContentAgent(action: string, params: any) {
  // Call Gemini API for content generation
  try {
    const prompt = `Generate 3 concise social media reply options to: "${params.message}". Tone: ${params.tone || "professional"}. Keep each under 280 characters.`;

    // Placeholder - would call actual Gemini API
    console.log("Generating content with Gemini:", prompt);

    return {
      action,
      status: "executed",
      data: {
        message: params.message,
        options: [
          "That sounds great! Would love to hear more about this opportunity.",
          "Thanks for sharing! Let's connect and discuss further.",
          "Appreciate you reaching out! Looking forward to collaborating.",
        ],
      },
    };
  } catch (error) {
    throw new Error("Failed to generate content");
  }
}

async function executeSchedulingAgent(action: string, params: any) {
  // Placeholder for scheduling agent logic
  console.log("Executing scheduling agent:", action, params);
  return {
    action,
    status: "executed",
    data: {
      recipient: params.recipient,
      amount: params.amount,
      frequency: params.frequency,
      nextPayment: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  };
}

async function executeRebalancingAgent(action: string, params: any) {
  // Placeholder for rebalancing agent logic
  console.log("Executing rebalancing agent:", action, params);
  return {
    action,
    status: "executed",
    data: {
      currentAllocation: {
        HLUSD: "58%",
        ETH: "32%",
        OTHER: "10%",
      },
      targetAllocation: params.targetAllocation,
      recommendation: "Rebalance needed - HLUSD is below target",
    },
  };
}

async function executeBusinessAgent(action: string, params: any) {
  // Call Gemini API for business assistant
  try {
    const prompt = `As a business assistant, please help with: "${params.query}". Context: ${params.context || "General business"}`;

    // Placeholder - would call actual Gemini API
    console.log("Generating business response with Gemini:", prompt);

    return {
      action,
      status: "executed",
      data: {
        query: params.query,
        response: `Based on your question about ${params.query}, here are my recommendations:\n\n1. Focus on your core competencies\n2. Build strong relationships\n3. Measure and optimize continuously`,
      },
    };
  } catch (error) {
    throw new Error("Failed to generate response");
>>>>>>> 7298a30 (feat(api): add agent execution, gemini wrapper, and health check routes)
  }
}
