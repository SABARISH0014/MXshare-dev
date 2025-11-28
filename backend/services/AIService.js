import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// --- INITIALIZE CLIENTS ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// --- MODELS ---
// Llama 3.3 is extremely smart and fast on Groq
const CHAT_MODEL = "llama-3.3-70b-versatile"; 

// --- 1. Generate Embeddings (Google) ---
// We keep Google here because Groq doesn't natively support vector embeddings yet
export async function embedText(text) {
  try {
    if (!text || !text.trim()) return null;
    const result = await embedModel.embedContent(text);
    return result.embedding.values; // Returns 768-dim vector
  } catch (error) {
    console.error("Embedding Error:", error.message);
    return null;
  }
}

// --- 2. Text Generation Helper (Groq) ---
async function askGroq(messages, jsonMode = false) {
  try {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: CHAT_MODEL,
      temperature: 0.3,
      // Groq supports native JSON mode for Llama 3 models
      response_format: jsonMode ? { type: "json_object" } : undefined
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Groq Error:", error.message);
    return null;
  }
}

// --- 3. Moderation (Groq) ---
export async function moderate(text) {
  const prompt = `
    Analyze this text for safety. Return a JSON object with this exact structure:
    {"isSafe": boolean, "reason": "string"}
    Text: "${text.substring(0, 2000)}"
  `;

  const raw = await askGroq([{ role: "user", content: prompt }], true);
  
  if (!raw) return { isSafe: true };

  try {
    return JSON.parse(raw);
  } catch (e) {
    return { isSafe: true };
  }
}

// --- 4. Summarization (Groq) ---
export async function summarize({ content, type }) {
  const prompt = `
    Summarize this ${type} in 2 concise sentences for a student.
    Content: "${content.substring(0, 4000)}"
  `;
  
  const result = await askGroq([{ role: "user", content: prompt }]);
  return result || "Summary unavailable.";
}

// --- 5. Metadata Suggestion (Groq) ---
export async function suggestMetadata({ rawText, originalFilename }) {
  const prompt = `
    Suggest a title and 5 tags. Return JSON:
    {"title": "string", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}
    File: ${originalFilename}
    Text: "${rawText.substring(0, 3000)}"
  `;

  const raw = await askGroq([{ role: "user", content: prompt }], true);
  
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { title: originalFilename, tags: [] };
  }
}

// Export Alias
export const generateEmbedding = embedText;