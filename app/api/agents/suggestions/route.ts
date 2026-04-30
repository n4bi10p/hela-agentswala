import { NextResponse } from "next/server";
import { fetchAgentSuggestions, insertSuggestion, toggleUpvote } from "@/lib/reputation";
import type { AgentSuggestion } from "@/lib/reputation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId")?.trim();
  const caller = searchParams.get("caller")?.trim().toLowerCase();

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  try {
    const suggestions = await fetchAgentSuggestions(agentId, caller);
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
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
  const authorAddress = typeof body.authorAddress === "string" ? body.authorAddress.trim().toLowerCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const suggestionType = typeof body.suggestionType === "string" ? body.suggestionType.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;

  if (!agentId || !authorAddress || !title || !suggestionType) {
    return NextResponse.json({ error: "agentId, authorAddress, title, and suggestionType are required" }, { status: 400 });
  }

  const validTypes = ["bug", "feature", "ui", "other"];
  if (!validTypes.includes(suggestionType)) {
    return NextResponse.json({ error: "suggestionType must be bug, feature, ui, or other" }, { status: 400 });
  }

  if (title.length > 80) {
    return NextResponse.json({ error: "title must be 80 characters or less" }, { status: 400 });
  }

  if (description && description.length > 300) {
    return NextResponse.json({ error: "description must be 300 characters or less" }, { status: 400 });
  }

  try {
    const suggestion = await insertSuggestion({
      agentId,
      authorAddress,
      title,
      suggestionType: suggestionType as AgentSuggestion["suggestionType"],
      description
    });
    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit suggestion" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const suggestionId = typeof body.suggestionId === "string" ? body.suggestionId.trim() : "";
  const voterAddress = typeof body.voterAddress === "string" ? body.voterAddress.trim().toLowerCase() : "";

  if (!suggestionId || !voterAddress) {
    return NextResponse.json({ error: "suggestionId and voterAddress are required" }, { status: 400 });
  }

  try {
    const suggestion = await toggleUpvote(suggestionId, voterAddress);
    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update upvote" },
      { status: 500 }
    );
  }
}
