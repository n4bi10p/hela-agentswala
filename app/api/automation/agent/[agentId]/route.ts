import { NextResponse } from "next/server";
import { getStoredAgent } from "@/lib/automationStore";

type RouteContext = {
  params: {
    agentId: string;
  };
};

export async function GET(_req: Request, context: RouteContext) {
  const agentId = context.params.agentId;
  const storedAgent = getStoredAgent(agentId);

  return NextResponse.json(
    {
      automationReady: Boolean(storedAgent),
      storedAgent: storedAgent
        ? {
            agentId: storedAgent.agentId,
            agentWalletAddress: storedAgent.agentWalletAddress,
            status: storedAgent.status,
            deployedAt: storedAgent.deployedAt
          }
        : null
    },
    { status: 200 }
  );
}
