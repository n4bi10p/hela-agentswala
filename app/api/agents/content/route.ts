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

function humanizeFieldName(field: string): string {
  const withoutPrefix = field.replace(/^payload\./, "");
  return withoutPrefix
    .replace(/\./g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function toNaturalLanguageError(status: number, rawMessage: string | undefined, serverFallback: string): string {
  if (status >= 500) {
    return serverFallback;
  }

  const message = (rawMessage || "").trim();
  if (!message) {
    return "We could not understand the request. Please check your input and try again.";
  }

  if (message === "Malformed JSON body.") {
    return "The request body is not valid JSON. Please fix the JSON format and try again.";
  }
  if (message === "Request body must be a JSON object.") {
    return "Please send a JSON object in the request body.";
  }
  if (message === "payload must be a JSON object.") {
    return "Please send payload as a JSON object.";
  }
  if (message === "agentType is invalid.") {
    return "The selected agent type is not supported. Use trading, farming, scheduling, rebalancing, content, or business.";
  }
  if (message === "Gemini returned malformed JSON for replies." || message === "Gemini response must be a JSON array with exactly 3 strings.") {
    return "We could not generate three clean reply options this time. Please try again.";
  }
  if (message === "Gemini rate limit reached. Please retry shortly.") {
    return "The AI service is busy right now. Please retry in a moment.";
  }
  if (message === "Prompt cannot be empty.") {
    return "Please enter a message before sending the request.";
  }
  if (message === "Prompt is too large." || message === "System context is too large.") {
    return "Your request is too long. Please shorten it and try again.";
  }
  if (message === "tone must be professional, casual, or aggressive.") {
    return "Please set tone to professional, casual, or aggressive.";
  }

  const requiredMatch = message.match(/^(.+) is required\.$/);
  if (requiredMatch) {
    return `Please provide ${humanizeFieldName(requiredMatch[1])}.`;
  }

  const oneOfMatch = message.match(/^(.+) must be one of (.+)\.$/);
  if (oneOfMatch) {
    return `Please choose ${humanizeFieldName(oneOfMatch[1])} from: ${oneOfMatch[2]}.`;
  }

  return "Please review your request and try again.";
}

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
      return NextResponse.json(
        {
          error: toNaturalLanguageError(400, "Malformed JSON body.", "Content agent execution failed.")
        },
        { status: 400 }
      );
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = toNaturalLanguageError(status, mapped.message, "Content agent execution failed.");
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
