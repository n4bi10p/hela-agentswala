import { NextResponse } from "next/server";
import { callGemini } from "../../../../lib/gemini";

type Tone = "professional" | "casual" | "aggressive";

type ContentInput = {
  message: string;
  tone: Tone;
  brandContext: string;
};

type ContentResult = {
  replies: [string, string, string];
};

type RouteError = {
  statusCode?: number;
  message?: string;
};

function parseInput(body: unknown): ContentInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<ContentInput>;
  if (!input.message || typeof input.message !== "string") {
    throw { statusCode: 400, message: "message is required." };
  }
  if (!input.brandContext || typeof input.brandContext !== "string") {
    throw { statusCode: 400, message: "brandContext is required." };
  }
  if (!input.tone || !["professional", "casual", "aggressive"].includes(input.tone)) {
    throw { statusCode: 400, message: "tone must be professional, casual, or aggressive." };
  }

  return {
    message: input.message.trim(),
    brandContext: input.brandContext.trim(),
    tone: input.tone as Tone
  };
}

function parseReplies(raw: string): [string, string, string] {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonCandidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    throw { statusCode: 502, message: "Gemini returned malformed JSON for replies." };
  }

  if (!Array.isArray(parsed) || parsed.length !== 3 || !parsed.every((item) => typeof item === "string")) {
    throw { statusCode: 502, message: "Gemini response must be a JSON array with exactly 3 strings." };
  }

  return [parsed[0].trim(), parsed[1].trim(), parsed[2].trim()];
}

export async function runContentAgent(input: ContentInput): Promise<ContentResult> {
  const systemContext = [
    "You are an expert social media response assistant.",
    "You must return exactly one JSON array with 3 strings and no extra text.",
    "Each string should be a distinct, ready-to-post reply option.",
    `Tone to use: ${input.tone}`
  ].join("\n");

  const prompt = [
    `Incoming message: ${input.message}`,
    `Brand context: ${input.brandContext}`,
    "Return output as JSON only, like:",
    '["Reply 1", "Reply 2", "Reply 3"]'
  ].join("\n");

  const raw = await callGemini(prompt, systemContext);
  const replies = parseReplies(raw);
  return { replies };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);
    const result = await runContentAgent(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Content agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
