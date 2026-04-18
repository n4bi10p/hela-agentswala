import { NextResponse } from "next/server";
import { callGemini } from "../../../../lib/gemini";

type Formality = "formal" | "informal";

type BusinessInput = {
  query: string;
  businessContext: string;
  language: string;
  formality: Formality;
};

type BusinessResult = {
  response: string;
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
  if (message === "Gemini rate limit reached. Please retry shortly.") {
    return "The AI service is busy right now. Please retry in a moment.";
  }
  if (message === "Prompt cannot be empty.") {
    return "Please enter a message before sending the request.";
  }
  if (message === "Prompt is too large." || message === "System context is too large.") {
    return "Your request is too long. Please shorten it and try again.";
  }
  if (message === "formality must be formal or informal.") {
    return "Please set formality to formal or informal.";
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

function parseInput(body: unknown): BusinessInput {
  if (!body || typeof body !== "object") {
    throw { statusCode: 400, message: "Request body must be a JSON object." };
  }

  const input = body as Partial<BusinessInput>;
  if (!input.query || typeof input.query !== "string") {
    throw { statusCode: 400, message: "query is required." };
  }
  if (!input.businessContext || typeof input.businessContext !== "string") {
    throw { statusCode: 400, message: "businessContext is required." };
  }
  if (!input.language || typeof input.language !== "string") {
    throw { statusCode: 400, message: "language is required." };
  }
  if (!input.formality || !["formal", "informal"].includes(input.formality)) {
    throw { statusCode: 400, message: "formality must be formal or informal." };
  }

  return {
    query: input.query.trim(),
    businessContext: input.businessContext.trim(),
    language: input.language.trim(),
    formality: input.formality as Formality
  };
}

async function runBusinessAgent(input: BusinessInput): Promise<BusinessResult> {
  const systemContext = [
    "You are a senior business operations assistant.",
    `Always respond in ${input.language}.`,
    `Use ${input.formality} tone.`,
    "Give practical, concise, and actionable guidance based on provided context."
  ].join("\n");

  const prompt = [
    `Business context: ${input.businessContext}`,
    `User query: ${input.query}`
  ].join("\n");

  const response = await callGemini(prompt, systemContext);
  return { response };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseInput(body);
    const result = await runBusinessAgent(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: toNaturalLanguageError(400, "Malformed JSON body.", "Business agent execution failed.")
        },
        { status: 400 }
      );
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = toNaturalLanguageError(status, mapped.message, "Business agent execution failed.");
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
