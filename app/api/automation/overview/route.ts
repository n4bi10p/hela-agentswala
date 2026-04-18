import { NextResponse } from "next/server";
import { getStoredAgent, listExecutionLogsForOwner, listJobsForOwner } from "@/lib/automationStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerAddress = searchParams.get("ownerAddress");

  if (!ownerAddress) {
    return NextResponse.json({ error: "ownerAddress is required" }, { status: 400 });
  }

  const jobs = listJobsForOwner(ownerAddress).map((job) => {
    const storedAgent = getStoredAgent(job.agentId);
    return {
      ...job,
      agentWalletAddress: storedAgent?.agentWalletAddress || null,
      agentStatus: storedAgent?.status || null
    };
  });

  const logs = listExecutionLogsForOwner(ownerAddress);

  return NextResponse.json(
    {
      jobs,
      logs
    },
    { status: 200 }
  );
}
