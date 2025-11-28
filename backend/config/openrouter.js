// backend/config/openrouter.js
import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY env var");
}

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter is OpenAI-compatible :contentReference[oaicite:4]{index=4}
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "https://mxshare.dev",
    "X-Title": process.env.APP_NAME || "MXShare",
  },
});

export const GENERAL_MODEL =
  process.env.OPENROUTER_MODEL_GENERAL || "x-ai/grok-4.1-fast:free";

export const EMBEDDING_MODEL =
  process.env.OPENROUTER_MODEL_EMBEDDING || "openai/text-embedding-3-large";
