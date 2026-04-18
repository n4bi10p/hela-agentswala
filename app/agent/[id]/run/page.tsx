"use client";

import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

type BackendAgentType = "content" | "business";

type StoredAgentConfig = Record<string, string>;
type ConfigJson = Record<string, unknown>;
const REQUEST_TIMEOUT_MS = 30000;

type ContentRouteResponse = {
  replies?: string[];
  error?: string;
};

type BusinessRouteResponse = {
  response?: string;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const AGENT_DETAILS: Record<
  string,
  { name: string; type: string; backendType: BackendAgentType; placeholder: string }
> = {
  "3": {
    name: "Social Sentinel",
    type: "CONTENT",
    backendType: "content",
    placeholder: "Paste the message you received...",
  },
  "7": {
    name: "Business Assistant",
    type: "BUSINESS",
    backendType: "business",
    placeholder: "Ask your question or describe the task...",
  },
};

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  options?: string[];
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTone(value: string): "professional" | "casual" | "aggressive" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "casual" || normalized === "aggressive") {
    return normalized;
  }
  return "professional";
}

function normalizeFormality(value: string): "formal" | "informal" {
  return value.trim().toLowerCase() === "informal" ? "informal" : "formal";
}

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseDelimitedMap(value: string): Record<string, unknown> | null {
  if (!value.includes(":")) {
    return null;
  }

  const result: Record<string, unknown> = {};
  const segments = value
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (!segments.length) {
    return null;
  }

  for (const segment of segments) {
    const [rawKey, rawValue] = segment.split(":");
    const key = rawKey?.trim();
    const val = rawValue?.trim();
    if (!key || !val) {
      continue;
    }

    const numericCandidate = Number(val.replace("%", "").trim());
    result[key] = Number.isFinite(numericCandidate) ? numericCandidate : val;
  }

  return Object.keys(result).length ? result : null;
}

function parseConfigValue(rawValue: string): unknown {
  const value = rawValue.trim();

  if (!value) {
    return "";
  }

  const lower = value.toLowerCase();
  if (lower === "true") {
    return true;
  }
  if (lower === "false") {
    return false;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && /^[+-]?\d+(\.\d+)?$/.test(value.replace("%", ""))) {
    return value.endsWith("%") ? Number(value.replace("%", "")) : numeric;
  }

  const parsedJson = tryParseJson(value);
  if (parsedJson !== null) {
    return parsedJson;
  }

  const parsedMap = parseDelimitedMap(value);
  if (parsedMap) {
    return parsedMap;
  }

  return value;
}

function buildConfigJson(config: StoredAgentConfig): ConfigJson {
  const normalized: ConfigJson = {};

  for (const [key, rawValue] of Object.entries(config)) {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      continue;
    }
    normalized[key] = parseConfigValue(trimmed);
  }

  return normalized;
}

function getStoredAgentConfig(agentId: string): StoredAgentConfig {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(`agent-config-${agentId}`);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as StoredAgentConfig;
    }
  } catch {
    // Ignore malformed local config and fall back to defaults.
  }

  return {};
}

async function postJson<TResponse>(url: string, payload: Record<string, unknown>): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    let parsed: unknown = {};

    if (raw.trim()) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        if (!response.ok) {
          throw new Error(`Request failed (${response.status}).`);
        }
        throw new Error("Backend returned a non-JSON response.");
      }
    }

    if (!response.ok) {
      const errorMessage = isRecord(parsed) && typeof parsed.error === "string"
        ? parsed.error
        : `Request failed (${response.status}).`;
      throw new Error(errorMessage);
    }

    return parsed as TResponse;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callContentAgent(message: string, config: StoredAgentConfig): Promise<string[]> {
  const configJson = buildConfigJson(config);
  const payload = {
    message,
    tone: normalizeTone(config["Tone"] || "professional"),
    brandContext: (config["Brand Context"] || "General brand communication context").trim(),
    frontendConfigText: JSON.stringify(configJson),
  };

  const data = await postJson<ContentRouteResponse>("/api/agents/content", payload);

  if (!Array.isArray(data.replies) || data.replies.length === 0) {
    throw new Error("Content agent returned no reply options.");
  }

  return data.replies;
}

async function callBusinessAgent(query: string, config: StoredAgentConfig): Promise<string> {
  const configJson = buildConfigJson(config);
  const payload = {
    query,
    businessContext: (config["Industry Context"] || config["Business Type"] || "General business context").trim(),
    language: (config["Response Language"] || "English").trim(),
    formality: normalizeFormality(config["Formality"] || "formal"),
    frontendConfigText: JSON.stringify(configJson),
  };

  const data = await postJson<BusinessRouteResponse>("/api/agents/business", payload);

  if (!data.response || typeof data.response !== "string") {
    throw new Error("Business agent returned an empty response.");
  }

  return data.response;
}

export default function AgentRunPage() {
  const params = useParams();
  const agentId = params.id as string;
  const agent = AGENT_DETAILS[agentId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!agent) {
    return (
      <main className="min-h-screen bg-black">
        <TopNavBar />
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="text-center">
            <h1 className="font-headline text-4xl text-white mb-4">
              AGENT NOT FOUND
            </h1>
            <Link
              href="/dashboard"
              className="text-white hover:text-white/60 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const prompt = inputValue.trim();

    // Add user message
    const userMessage: Message = {
      id: createMessageId(),
      type: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const storedConfig = getStoredAgentConfig(agentId);

      if (agent.backendType === "content") {
        const replies = await callContentAgent(prompt, storedConfig);
        const assistantMessage: Message = {
          id: createMessageId(),
          type: "assistant",
          content:
            "Generated response options from the content agent. Pick one and send, or ask for another set.",
          timestamp: new Date(),
          options: replies.slice(0, 3),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const response = await callBusinessAgent(prompt, storedConfig);
        const assistantMessage: Message = {
          id: createMessageId(),
          type: "assistant",
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Agent execution failed.";
      const assistantMessage: Message = {
        id: createMessageId(),
        type: "assistant",
        content: `Request failed: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
  };

  const handleCopyOption = async (option: string) => {
    try {
      await navigator.clipboard.writeText(option);
      setCopyMessage("Response copied.");
      setTimeout(() => setCopyMessage(null), 1500);
    } catch {
      setCopyMessage("Copy failed. Please copy manually.");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <TopNavBar />

      <div className="flex-1 flex flex-col mt-24">
        {/* Header */}
        <header className="px-8 py-6 border-b border-white/12">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/dashboard"
              className="text-white/60 hover:text-white transition-colors font-mono text-xs mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="font-headline text-5xl text-white uppercase">
              {agent.name}
            </h1>
            <p className="text-white/60 font-mono text-xs mt-2 uppercase">
              {agent.type} AGENT
            </p>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-white/60 font-mono text-sm uppercase">
                    Start by entering your {agent.type.toLowerCase()} query
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`max-w-2xl ${
                        message.type === "user"
                          ? "bg-white text-black"
                          : "bg-surface-container border border-white/12 text-white"
                      } p-4`}
                    >
                      <p className="font-body text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-60 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Options for Content Reply Agent */}
                  {message.options && message.options.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <p className="text-white/60 font-mono text-xs uppercase mb-3">
                        Select or copy a response:
                      </p>
                      {message.options.map((option, idx) => (
                        <div
                          key={idx}
                          className="border border-white/20 p-4 flex items-start justify-between gap-4 hover:border-white transition-colors group"
                        >
                          <p className="font-body text-sm text-white flex-1">
                            {option}
                          </p>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleSelectOption(option)}
                              className="px-3 py-1 border border-white text-white text-xs font-mono hover:bg-white hover:text-black transition-colors"
                            >
                              [ USE ]
                            </button>
                            <button
                              onClick={() => handleCopyOption(option)}
                              className="px-3 py-1 border border-white/50 text-white/60 text-xs font-mono hover:border-white hover:text-white transition-colors"
                            >
                              [ COPY ]
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-container border border-white/12 text-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <p className="font-body text-sm">Generating response...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/12 p-8 bg-black">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey && !isLoading) {
                    handleSendMessage();
                  }
                }}
                placeholder={agent.placeholder}
                rows={4}
                className="w-full bg-surface-container border border-white/20 text-white placeholder-white/30 p-4 font-body text-sm focus:outline-none focus:border-white transition-colors resize-none"
              />

              <div className="flex gap-4">
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="flex-1 bg-white text-black py-3 font-headline hover:bg-black hover:text-white border border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                  {isLoading ? "PROCESSING..." : "[ SEND ↗ ]"}
                </button>

                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-headline uppercase"
                >
                  [ CLOSE ]
                </Link>
              </div>

              <p className="text-white/40 font-mono text-xs">
                Tip: Press Ctrl+Enter to send
              </p>

              {copyMessage && (
                <p className="text-white/70 font-mono text-xs uppercase">
                  {copyMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
