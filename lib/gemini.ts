import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_PROMPT_CHARS = 8000;
const MAX_SYSTEM_CONTEXT_CHARS = 4000;

class GeminiCallError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "GeminiCallError";
    this.statusCode = statusCode;
  }
}

function mapGeminiError(error: unknown): GeminiCallError {
  if (error instanceof GeminiCallError) {
    return error;
  }

  const maybeError = error as {
    status?: number;
    statusCode?: number;
    message?: string;
  };

  const statusCode = maybeError.statusCode ?? maybeError.status;
  const message = (maybeError.message || "Gemini request failed").toString();

  if (statusCode === 429 || message.includes("429") || /rate\s*limit/i.test(message)) {
    return new GeminiCallError("Gemini rate limit reached. Please retry shortly.", 429);
  }

  if (statusCode === 400) {
    return new GeminiCallError("Gemini rejected the request payload.", 400);
  }

  if (statusCode === 401 || statusCode === 403) {
    return new GeminiCallError("Gemini authentication failed. Check GEMINI_API_KEY.", 500);
  }

  return new GeminiCallError("Gemini service is temporarily unavailable.", 502);
}

export async function callGemini(prompt: string, systemContext?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiCallError("Missing GEMINI_API_KEY environment variable.", 500);
  }

  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new GeminiCallError("Prompt cannot be empty.", 400);
  }
  if (normalizedPrompt.length > MAX_PROMPT_CHARS) {
    throw new GeminiCallError("Prompt is too large.", 400);
  }

  const normalizedSystemContext = systemContext?.trim();
  if (normalizedSystemContext && normalizedSystemContext.length > MAX_SYSTEM_CONTEXT_CHARS) {
    throw new GeminiCallError("System context is too large.", 400);
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: normalizedSystemContext || undefined
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: normalizedPrompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 700
      }
    });

    const text = result.response.text()?.trim();
    if (!text) {
      throw new GeminiCallError("Gemini returned an empty response.", 502);
    }

    return text;
  } catch (error: unknown) {
    throw mapGeminiError(error);
  }
}
