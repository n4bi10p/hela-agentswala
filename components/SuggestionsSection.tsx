"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgentSuggestion } from "@/lib/reputation";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bug: { label: "Bug", color: "bg-red-400/10 text-red-300 border-red-400/20" },
  feature: { label: "Feature", color: "bg-violet-400/10 text-violet-300 border-violet-400/20" },
  ui: { label: "UI", color: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20" },
  other: { label: "Other", color: "bg-white/5 text-white/40 border-white/10" }
};

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

function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type SuggestionsSectionProps = {
  agentId: string;
  connectedWallet: string | null;
};

export function SuggestionsSection({ agentId, connectedWallet }: SuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", suggestionType: "feature" as AgentSuggestion["suggestionType"], description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/agents/suggestions?agentId=${encodeURIComponent(agentId)}${connectedWallet ? `&caller=${encodeURIComponent(connectedWallet)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { suggestions: AgentSuggestion[] };
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [agentId, connectedWallet]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const handleSubmit = async () => {
    if (!connectedWallet || !draft.title.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/agents/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          authorAddress: connectedWallet,
          title: draft.title,
          suggestionType: draft.suggestionType,
          description: draft.description || undefined
        })
      });
      const data = (await res.json()) as { suggestion?: unknown; error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit");
      } else {
        setSubmitSuccess(true);
        setShowForm(false);
        setDraft({ title: "", suggestionType: "feature", description: "" });
        await loadSuggestions();
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (suggestionId: string) => {
    if (!connectedWallet) return;
    setUpvotingId(suggestionId);
    try {
      const res = await fetch("/api/agents/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, voterAddress: connectedWallet })
      });
      if (res.ok) {
        const data = (await res.json()) as { suggestion: AgentSuggestion };
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestionId ? data.suggestion : s))
            .sort((a, b) => b.upvoteCount - a.upvoteCount)
        );
      }
    } catch {
      // silent
    } finally {
      setUpvotingId(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-widest text-white/80 uppercase">
          Suggestions
          {suggestions.length > 0 && (
            <span className="ml-2 text-xs text-white/30 normal-case">({suggestions.length})</span>
          )}
        </h3>
        {connectedWallet && !showForm && (
          <button
            id="add-suggestion-btn"
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold tracking-widest px-4 py-2 rounded-lg border border-violet-400/40 text-violet-300 hover:bg-violet-400/10 transition-all duration-200"
          >
            + SUGGEST
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-300 tracking-wider">New Suggestion</p>
            <button onClick={() => { setShowForm(false); setSubmitError(null); }} className="text-white/30 hover:text-white/60 text-lg leading-none">×</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-xs text-white/40 mb-1">Title *</p>
              <input
                type="text"
                value={draft.title}
                maxLength={80}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Short, descriptive title..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-400/40"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-white/40 mb-1">Type</p>
              <select
                value={draft.suggestionType}
                onChange={(e) => setDraft((p) => ({ ...p, suggestionType: e.target.value as AgentSuggestion["suggestionType"] }))}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-violet-400/40"
              >
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="ui">UI Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs text-white/40 mb-1">Description (optional, max 300 chars)</p>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value.slice(0, 300) }))}
              rows={3}
              placeholder="Describe the issue or feature in detail..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-violet-400/40"
            />
            <p className="text-[10px] text-white/25 text-right mt-0.5">{draft.description.length}/300</p>
          </div>

          {submitError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{submitError}</p>
          )}

          <button
            id="submit-suggestion-btn"
            onClick={handleSubmit}
            disabled={!draft.title.trim() || submitting}
            className="w-full py-2.5 rounded-lg bg-violet-400/20 border border-violet-400/40 text-violet-300 text-sm font-semibold tracking-widest hover:bg-violet-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT SUGGESTION"}
          </button>
        </div>
      )}

      {submitSuccess && (
        <div className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-2">
          ✓ Suggestion submitted!
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-xs text-white/30 text-center py-6">Loading suggestions...</div>
      ) : suggestions.length === 0 ? (
        <div className="text-xs text-white/30 text-center py-8 border border-dashed border-white/10 rounded-xl">
          No suggestions yet.{connectedWallet ? " Help improve this agent." : ""}
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => {
            const typeInfo = TYPE_LABELS[s.suggestionType] ?? TYPE_LABELS.other;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4 hover:bg-white/5 transition-colors duration-200"
              >
                {/* Upvote button */}
                <button
                  onClick={() => handleUpvote(s.id)}
                  disabled={!connectedWallet || upvotingId === s.id}
                  className={[
                    "flex-shrink-0 flex flex-col items-center gap-0.5 w-10 pt-0.5",
                    "text-xs rounded-lg border px-1 py-1.5 transition-all duration-150",
                    s.hasUpvoted
                      ? "border-violet-400/50 bg-violet-400/15 text-violet-300"
                      : "border-white/10 bg-white/3 text-white/30 hover:border-violet-400/30 hover:text-violet-300/60",
                    (!connectedWallet || upvotingId === s.id) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  ].join(" ")}
                >
                  <span>▲</span>
                  <span className="font-semibold">{s.upvoteCount}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>
                    <span className="text-sm text-white/80 font-medium truncate">{s.title}</span>
                  </div>
                  {s.description && (
                    <p className="text-xs text-white/50 leading-relaxed">{s.description}</p>
                  )}
                  <p className="text-[10px] text-white/25 mt-1.5">
                    {shortenAddress(s.authorAddress)} · {timeAgo(s.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!connectedWallet && (
        <p className="text-xs text-white/30 text-center">Connect your wallet to submit suggestions or upvote.</p>
      )}
    </div>
  );
}
