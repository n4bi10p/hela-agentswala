"use client";

import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

const AGENT_DETAILS: Record<string, { name: string; type: string; placeholder: string }> = {
  "3": {
    name: "Social Sentinel",
    type: "CONTENT",
    placeholder: "Paste the message you received...",
  },
  "7": {
    name: "Business Assistant",
    type: "BUSINESS",
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

export default function AgentRunPage() {
  const params = useParams();
  const agentId = params.id as string;
  const agent = AGENT_DETAILS[agentId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate API call to Gemini/agent backend
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Add assistant response
    let assistantContent = "";
    let options: string[] | undefined = undefined;

    if (agent.type === "CONTENT") {
      assistantContent =
        "I've generated 3 response options based on your message. Pick the one that best fits your tone!";
      options = [
        "That's great! Thanks for the update. Would love to discuss further.",
        "Thanks for reaching out! Let's connect soon to talk more.",
        "Appreciate you! Hit me up when you have a chance to chat.",
      ];
    } else {
      assistantContent =
        "Based on your query, here's my analysis:\n\nYour business question shows strong strategic thinking. I'd recommend:\n\n1. Focus on customer retention first\n2. Optimize your current processes\n3. Consider market expansion in Q2\n\nLet me know if you need more details on any of these points.";
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: assistantContent,
      timestamp: new Date(),
      options: options,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
  };

  const handleCopyOption = (option: string) => {
    navigator.clipboard.writeText(option);
    alert("Copied to clipboard!");
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
