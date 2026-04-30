"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedEvent } from "@/lib/reputation";

function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FeedEventWithAgentName = FeedEvent & { agentName?: string };

function EventPill({ event }: { event: FeedEventWithAgentName }) {
  const stars = "★".repeat(event.stars ?? 0);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-full border border-white/8 bg-white/3 text-[11px] text-white/55">
      <span className="font-mono text-white/40">{shortenAddress(event.actorAddress)}</span>
      {event.type === "review" ? (
        <>
          <span className="text-white/30">rated</span>
          <span className="text-amber-400 text-[10px]">{stars}</span>
        </>
      ) : (
        <span className="text-white/30">activated</span>
      )}
      {event.agentName && (
        <span className="text-white/65 font-medium">{event.agentName}</span>
      )}
      <span className="text-white/25">·</span>
      <span className="text-white/30">{timeAgo(event.timestamp)}</span>
    </span>
  );
}

export function ActivityFeed() {
  const [events, setEvents] = useState<FeedEventWithAgentName[]>([]);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/feed?limit=15", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { events?: FeedEvent[] }) => {
        setEvents(data.events ?? []);
      })
      .catch(() => null);
  }, []);

  // Auto-scroll animation via CSS
  const items = [...events, ...events]; // duplicate for seamless loop

  if (events.length === 0) return null;

  return (
    <div className="w-full overflow-hidden relative py-2">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#0a0a0f] to-transparent" />

      <div
        ref={tickerRef}
        className="flex gap-2 animate-ticker"
        style={{
          animationDuration: `${Math.max(events.length * 4, 20)}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite"
        }}
      >
        {items.map((event, i) => (
          <EventPill key={`${event.agentId}-${i}`} event={event} />
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation-name: ticker;
        }
      `}</style>
    </div>
  );
}
