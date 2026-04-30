"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import type { DeveloperReputation } from "@/lib/reputation";

type DeveloperRepBadgeProps = {
  developerAddress: string;
  compact?: boolean;
};

function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function DeveloperRepBadge({ developerAddress, compact = false }: DeveloperRepBadgeProps) {
  const [rep, setRep] = useState<DeveloperReputation | null>(null);

  useEffect(() => {
    if (!developerAddress) return;
    fetch(`/api/developers/${encodeURIComponent(developerAddress)}/reputation`, {
      cache: "no-store"
    })
      .then((r) => r.json())
      .then((data: DeveloperReputation) => setRep(data))
      .catch(() => null);
  }, [developerAddress]);

  if (compact) {
    // Inline mini badge for marketplace cards
    return (
      <div className="flex items-center gap-1">
        <span className="text-amber-400 text-xs">★</span>
        <span className="text-xs text-white/60">
          {rep ? rep.averageStars.toFixed(1) : "—"}
        </span>
        {rep && rep.totalReviews > 0 && (
          <span className="text-[10px] text-white/30">({rep.totalReviews})</span>
        )}
      </div>
    );
  }

  // Full badge for agent detail page
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">Developer</p>
          <p className="text-xs font-mono text-white/70">{shortenAddress(developerAddress)}</p>
        </div>
        {rep ? (
          <div className="text-right space-y-0.5">
            {rep.averageStars > 0 ? (
              <>
                <div className="flex items-center justify-end gap-1.5">
                  <StarRating value={rep.averageStars} size="sm" />
                  <span className="text-sm font-bold text-white">{rep.averageStars.toFixed(1)}</span>
                </div>
                <p className="text-[10px] text-white/30">
                  {rep.totalReviews} review{rep.totalReviews !== 1 ? "s" : ""}
                  {" · "}
                  {rep.totalAgents} agent{rep.totalAgents !== 1 ? "s" : ""}
                </p>
                {rep.totalActivations > 0 && (
                  <p className="text-[10px] text-white/30">{rep.totalActivations} total activations</p>
                )}
              </>
            ) : (
              <p className="text-xs text-white/30">No reviews yet</p>
            )}
          </div>
        ) : (
          <div className="text-xs text-white/20 animate-pulse">Loading...</div>
        )}
      </div>

      {rep && rep.averageStars > 0 && (
        <div className="mt-3 pt-3 border-t border-white/8 flex items-center gap-2">
          <div
            className="h-1.5 rounded-full flex-1 bg-white/8 overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(rep.score, 100)}%`,
                background: rep.score >= 80
                  ? "#34d399"
                  : rep.score >= 60
                    ? "#fbbf24"
                    : "#f87171"
              }}
            />
          </div>
          <span className="text-[10px] text-white/40">Score {Math.round(rep.score)}/100</span>
        </div>
      )}
    </div>
  );
}
