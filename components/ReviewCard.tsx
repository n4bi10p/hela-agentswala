"use client";

import { StarRating } from "./StarRating";
import type { AgentReview } from "@/lib/reputation";

type ReviewCardProps = {
  review: AgentReview;
};

const TAG_COLORS: Record<string, string> = {
  "Works great": "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  "Needs improvement": "bg-amber-400/10 text-amber-300 border-amber-400/20",
  "Bug found": "bg-red-400/10 text-red-300 border-red-400/20",
  Fast: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  Slow: "bg-orange-400/10 text-orange-300 border-orange-400/20"
};

function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initials = review.reviewerAddress.slice(2, 4).toUpperCase();

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4 hover:bg-white/5 transition-colors duration-200">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white/80"
          style={{
            background: `hsl(${parseInt(review.reviewerAddress.slice(2, 6), 16) % 360}, 60%, 35%)`
          }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-white/50">{shortenAddress(review.reviewerAddress)}</span>
            <StarRating value={review.stars} size="sm" />
            <span className="text-xs text-white/30 ml-auto">{timeAgo(review.createdAt)}</span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-white/75 leading-relaxed mt-1">{review.comment}</p>
          )}

          {/* Tags */}
          {review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] ?? "bg-white/5 text-white/50 border-white/10"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
