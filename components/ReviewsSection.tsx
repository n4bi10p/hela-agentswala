"use client";

import { useCallback, useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";
import type { RatingSummary } from "@/lib/reputation";

const TAGS = ["Works great", "Needs improvement", "Bug found", "Fast", "Slow"] as const;
type Tag = (typeof TAGS)[number];

type ReviewsSectionProps = {
  agentId: string;
  connectedWallet: string | null;
  isOwned: boolean;
};

function BreakdownBar({ label, count, total }: { label: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-white/40 w-4 text-right">{label}</span>
      <span className="text-amber-400 text-[10px]">★</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400/60 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/30 w-4">{count}</span>
    </div>
  );
}

export function ReviewsSection({ agentId, connectedWallet, isOwned }: ReviewsSectionProps) {
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ stars: 0, comment: "", tags: [] as Tag[] });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/ratings?agentId=${encodeURIComponent(agentId)}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = (await res.json()) as RatingSummary;
        setSummary(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const toggleTag = (tag: Tag) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const hasAlreadyReviewed =
    connectedWallet &&
    summary?.reviews.some(
      (r) => r.reviewerAddress.toLowerCase() === connectedWallet.toLowerCase()
    );

  const handleSubmit = async () => {
    if (!connectedWallet || draft.stars === 0) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/agents/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          reviewerAddress: connectedWallet,
          stars: draft.stars,
          comment: draft.comment || undefined,
          tags: draft.tags
        })
      });

      const data = (await res.json()) as { review?: unknown; error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit review");
      } else {
        setSubmitSuccess(true);
        setShowForm(false);
        setDraft({ stars: 0, comment: "", tags: [] });
        await loadSummary();
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch {
      setSubmitError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold tracking-widest text-white/80 uppercase">
            Reviews
          </h3>
          {!loading && summary && summary.reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-white font-semibold">{summary.averageStars}</span>
              <span className="text-white/40 text-sm">({summary.reviewCount})</span>
            </div>
          )}
        </div>

        {isOwned && connectedWallet && !showForm && (
          <button
            id="write-review-btn"
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold tracking-widest px-4 py-2 rounded-lg border border-amber-400/40 text-amber-300 hover:bg-amber-400/10 transition-all duration-200"
          >
            {hasAlreadyReviewed ? "✏ EDIT REVIEW" : "+ WRITE REVIEW"}
          </button>
        )}
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-300 tracking-wider">
              {hasAlreadyReviewed ? "Update your review" : "Leave a review"}
            </p>
            <button
              onClick={() => { setShowForm(false); setSubmitError(null); }}
              className="text-white/30 hover:text-white/60 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Star Picker */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">Rating:</span>
            <StarRating value={draft.stars} onChange={(s) => setDraft((p) => ({ ...p, stars: s }))} size="lg" />
            {draft.stars > 0 && (
              <span className="text-xs text-white/40">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][draft.stars]}
              </span>
            )}
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs text-white/40 mb-2">Tags (optional)</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={[
                    "text-xs px-3 py-1 rounded-full border transition-all duration-150",
                    draft.tags.includes(tag)
                      ? "bg-amber-400/20 border-amber-400/50 text-amber-300"
                      : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                  ].join(" ")}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-xs text-white/40 mb-1">Comment (optional, max 500 chars)</p>
            <textarea
              value={draft.comment}
              onChange={(e) => setDraft((p) => ({ ...p, comment: e.target.value.slice(0, 500) }))}
              rows={3}
              placeholder="Share your experience with this agent..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-amber-400/40"
            />
            <p className="text-[10px] text-white/25 text-right mt-0.5">{draft.comment.length}/500</p>
          </div>

          {submitError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            id="submit-review-btn"
            onClick={handleSubmit}
            disabled={draft.stars === 0 || submitting}
            className="w-full py-2.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-sm font-semibold tracking-widest hover:bg-amber-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
          </button>
        </div>
      )}

      {/* Success toast */}
      {submitSuccess && (
        <div className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-2">
          ✓ Review submitted successfully!
        </div>
      )}

      {/* Star Breakdown */}
      {!loading && summary && summary.reviewCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 p-4 rounded-xl border border-white/8 bg-white/3">
          <div className="space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <BreakdownBar
                key={star}
                label={star}
                count={summary.breakdown[star]}
                total={summary.reviewCount}
              />
            ))}
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5 px-6">
            <span className="text-4xl font-bold text-white">{summary.averageStars}</span>
            <StarRating value={summary.averageStars} size="sm" />
            <span className="text-xs text-white/40 mt-1">{summary.reviewCount} review{summary.reviewCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-xs text-white/30 text-center py-6">Loading reviews...</div>
      ) : !summary || summary.reviewCount === 0 ? (
        <div className="text-xs text-white/30 text-center py-8 border border-dashed border-white/10 rounded-xl">
          No reviews yet.{isOwned ? " Be the first to review this agent." : ""}
        </div>
      ) : (
        <div className="space-y-3">
          {summary.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Gate message for non-owners */}
      {!isOwned && connectedWallet && (
        <p className="text-xs text-white/30 text-center">
          Activate this agent to leave a review.
        </p>
      )}
    </div>
  );
}
