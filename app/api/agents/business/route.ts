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

export async function runBusinessAgent(input: BusinessInput): Promise<BusinessResult> {
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
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }
    const mapped = error as RouteError;
    const status = mapped.statusCode && mapped.statusCode >= 400 ? mapped.statusCode : 500;
    const errorMessage = status >= 500 ? "Business agent execution failed." : mapped.message || "Invalid request.";
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}
