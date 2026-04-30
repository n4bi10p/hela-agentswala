import { getSupabaseAdminClient, hasSupabaseAdminEnv } from "./supabaseAdmin";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type AgentReview = {
  id: string;
  agentId: string;
  reviewerAddress: string;
  stars: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type RatingSummary = {
  averageStars: number;
  reviewCount: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: AgentReview[];
};

export type AgentSuggestion = {
  id: string;
  agentId: string;
  authorAddress: string;
  title: string;
  suggestionType: "bug" | "feature" | "ui" | "other";
  description: string | null;
  upvoteCount: number;
  hasUpvoted: boolean;
  createdAt: string;
};

export type DeveloperReputation = {
  developerAddress: string;
  averageStars: number;
  totalReviews: number;
  totalAgents: number;
  totalActivations: number;
  score: number;
};

export type FeedEvent = {
  type: "review" | "activation";
  agentId: string;
  agentName?: string;
  actorAddress: string;
  stars?: number;
  timestamp: string;
};

// ─────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────

function toReview(row: Record<string, unknown>): AgentReview {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    reviewerAddress: String(row.reviewer_address),
    stars: Number(row.stars),
    comment: typeof row.comment === "string" ? row.comment : null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export async function fetchAgentRatings(agentId: string): Promise<RatingSummary> {
  const empty: RatingSummary = {
    averageStars: 0,
    reviewCount: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reviews: []
  };

  if (!hasSupabaseAdminEnv()) {
    return empty;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_reviews")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return empty;
  }

  const rows = data as Record<string, unknown>[];
  const reviews = rows.map(toReview);
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  let total = 0;
  for (const review of reviews) {
    const star = review.stars as 1 | 2 | 3 | 4 | 5;
    breakdown[star] = (breakdown[star] ?? 0) + 1;
    total += review.stars;
  }

  return {
    averageStars: Number((total / reviews.length).toFixed(1)),
    reviewCount: reviews.length,
    breakdown,
    reviews
  };
}

export async function upsertReview(params: {
  agentId: string;
  reviewerAddress: string;
  stars: number;
  comment?: string;
  tags?: string[];
}): Promise<AgentReview> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agent_reviews")
    .upsert(
      {
        agent_id: params.agentId,
        reviewer_address: params.reviewerAddress.toLowerCase(),
        stars: params.stars,
        comment: params.comment?.trim() || null,
        tags: params.tags ?? [],
        updated_at: new Date().toISOString()
      },
      { onConflict: "agent_id,reviewer_address" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save review");
  }

  return toReview(data as Record<string, unknown>);
}

// ─────────────────────────────────────────
// Developer Reputation
// ─────────────────────────────────────────

export async function fetchDeveloperReputation(
  developerAddress: string,
  agentIds: string[]
): Promise<DeveloperReputation> {
  const empty: DeveloperReputation = {
    developerAddress,
    averageStars: 0,
    totalReviews: 0,
    totalAgents: agentIds.length,
    totalActivations: 0,
    score: 0
  };

  if (!hasSupabaseAdminEnv() || agentIds.length === 0) {
    return empty;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_reviews")
    .select("stars, agent_id")
    .in("agent_id", agentIds);

  if (error || !data || data.length === 0) {
    return empty;
  }

  const rows = data as { stars: number; agent_id: string }[];
  const totalReviews = rows.length;
  const totalStars = rows.reduce((sum, r) => sum + r.stars, 0);
  const averageStars = totalReviews > 0 ? Number((totalStars / totalReviews).toFixed(1)) : 0;

  // Score = weighted average (70%) + activation bonus (30%, capped at 100 activations normalized)
  const score = Number((averageStars * 20).toFixed(1)); // 5 stars = 100 score

  return {
    developerAddress,
    averageStars,
    totalReviews,
    totalAgents: agentIds.length,
    totalActivations: 0, // enriched by caller
    score
  };
}

// ─────────────────────────────────────────
// Suggestions
// ─────────────────────────────────────────

function toSuggestion(row: Record<string, unknown>, callerAddress?: string): AgentSuggestion {
  const upvotes = Array.isArray(row.upvotes) ? (row.upvotes as string[]) : [];
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    authorAddress: String(row.author_address),
    title: String(row.title),
    suggestionType: (row.suggestion_type as AgentSuggestion["suggestionType"]) ?? "other",
    description: typeof row.description === "string" ? row.description : null,
    upvoteCount: upvotes.length,
    hasUpvoted: callerAddress ? upvotes.includes(callerAddress.toLowerCase()) : false,
    createdAt: String(row.created_at)
  };
}

export async function fetchAgentSuggestions(agentId: string, callerAddress?: string): Promise<AgentSuggestion[]> {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_suggestions")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const rows = (data as Record<string, unknown>[]).map((r) => toSuggestion(r, callerAddress));
  return rows.sort((a, b) => b.upvoteCount - a.upvoteCount);
}

export async function insertSuggestion(params: {
  agentId: string;
  authorAddress: string;
  title: string;
  suggestionType: AgentSuggestion["suggestionType"];
  description?: string;
}): Promise<AgentSuggestion> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agent_suggestions")
    .insert({
      agent_id: params.agentId,
      author_address: params.authorAddress.toLowerCase(),
      title: params.title.trim(),
      suggestion_type: params.suggestionType,
      description: params.description?.trim() || null,
      upvotes: []
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to submit suggestion");
  }

  return toSuggestion(data as Record<string, unknown>);
}

export async function toggleUpvote(suggestionId: string, voterAddress: string): Promise<AgentSuggestion> {
  const supabase = getSupabaseAdminClient();
  const voter = voterAddress.toLowerCase();

  const { data: existing, error: fetchError } = await supabase
    .from("agent_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Suggestion not found");
  }

  const row = existing as Record<string, unknown>;
  const upvotes = Array.isArray(row.upvotes) ? (row.upvotes as string[]) : [];
  const newUpvotes = upvotes.includes(voter)
    ? upvotes.filter((a) => a !== voter)
    : [...upvotes, voter];

  const { data: updated, error: updateError } = await supabase
    .from("agent_suggestions")
    .update({ upvotes: newUpvotes })
    .eq("id", suggestionId)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to update upvote");
  }

  return toSuggestion(updated as Record<string, unknown>, voter);
}

// ─────────────────────────────────────────
// Activity Feed
// ─────────────────────────────────────────

export async function fetchActivityFeed(limit = 10): Promise<FeedEvent[]> {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_reviews")
    .select("agent_id, reviewer_address, stars, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as Record<string, unknown>[]).map((row) => ({
    type: "review" as const,
    agentId: String(row.agent_id),
    actorAddress: String(row.reviewer_address),
    stars: Number(row.stars),
    timestamp: String(row.created_at)
  }));
}
