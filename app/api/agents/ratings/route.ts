import { NextResponse } from "next/server";
import { fetchAgentRatings, upsertReview } from "@/lib/reputation";
import { isAgentActivatedByUser } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId")?.trim();

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  try {
    const summary = await fetchAgentRatings(agentId);
    return NextResponse.json(summary, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
  const reviewerAddress = typeof body.reviewerAddress === "string" ? body.reviewerAddress.trim().toLowerCase() : "";
  const stars = typeof body.stars === "number" ? body.stars : Number(body.stars);
  const comment = typeof body.comment === "string" ? body.comment.trim() : undefined;
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];

  if (!agentId || !reviewerAddress) {
    return NextResponse.json({ error: "agentId and reviewerAddress are required" }, { status: 400 });
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "stars must be an integer between 1 and 5" }, { status: 400 });
  }

  if (comment && comment.length > 500) {
    return NextResponse.json({ error: "comment must be 500 characters or less" }, { status: 400 });
  }

  // Verify on-chain ownership
  try {
    const agentIdNum = Number(agentId);
    if (Number.isFinite(agentIdNum)) {
      const activated = await isAgentActivatedByUser(reviewerAddress, agentIdNum);
      if (!activated) {
        return NextResponse.json(
          { error: "You must activate this agent before leaving a review" },
          { status: 403 }
        );
      }
    }
  } catch {
    // If contract check fails, allow optimistically (don't block the review)
  }

  try {
    const review = await upsertReview({ agentId, reviewerAddress, stars, comment, tags });
    return NextResponse.json({ review }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save review" },
      { status: 500 }
    );
  }
}
