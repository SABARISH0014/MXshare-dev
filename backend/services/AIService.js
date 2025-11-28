import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Google SDK
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Needed for Embeddings

if (!GROQ_API_KEY) console.error("⚠️ WARNING: GROQ_API_KEY is missing.");
if (!GOOGLE_API_KEY) console.error("⚠️ WARNING: GOOGLE_API_KEY is missing (Embeddings will fail).");

const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

// --- CONFIGURATION ---
const MODELS = {
  TEXT: 'llama-3.3-70b-versatile',
  VISION: 'llama-3.2-90b-vision-preview',
  // Google's Embedding Model (768 dimensions)
  EMBEDDING: 'text-embedding-004' 
};

// --- HELPER: RETRY LOGIC ---
async function runWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 1000 * (i + 1))); 
    }
  }
}

// --- 1. TEXT MODERATION (Groq) ---
export async function moderateContent(text) {
  return runWithRetry(async () => {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a content moderation API. Return ONLY JSON." },
        { role: "user", content: `Analyze this text. Return JSON: {"overall": {"label": "safe|review|block", "max_score": 0, "primary_category": "none"}, "categories": { "hate_harassment": {"score": 0}, "violence_harm": {"score": 0}, "abusive_sexual": {"score": 0}, "illegal_dangerous": {"score": 0}, "misinformation": {"score": 0}, "child_safety": {"score": 0}, "privacy_sensitive": {"score": 0}, "copyright_ip": {"score": 0}, "user_intent": {"score": 0, "intent": "educational"} }} TEXT: "${text.substring(0, 15000)}"` }
      ],
      model: MODELS.TEXT,
      response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0].message.content);
  }).catch(e => {
    console.error("Moderation Failed:", e.message);
    return { overall: { label: 'review' }, categories: {} };
  });
}

// --- 2. TITLE SUGGESTION (Groq) ---
export async function suggestTitles(text) {
  return runWithRetry(async () => {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: `Suggest 3 academic titles for this text. Return JSON: { "titles": ["Title 1", "Title 2", "Title 3"] }. TEXT: ${text.substring(0, 5000)}` }],
      model: MODELS.TEXT,
      response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0].message.content).titles || [];
  }).catch(e => {
    console.error("Title Gen Failed:", e.message);
    return [];
  });
}

// --- 3. SUMMARY (Groq) ---
export async function generateSummary(text) {
  return runWithRetry(async () => {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: `Write a 3-sentence summary of this document. Just the text. TEXT: ${text.substring(0, 25000)}` }],
      model: MODELS.TEXT,
    });
    return completion.choices[0].message.content;
  }).catch(e => {
    console.error("Summary Failed:", e.message);
    return "Summary unavailable.";
  });
}

// --- 4. VISION ANALYSIS (Groq) ---
export async function analyzeImage(base64Image) {
  return runWithRetry(async () => {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze for safety. Return JSON: { \"isSafe\": boolean, \"flaggedCategories\": [], \"description\": \"...\" }" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      model: MODELS.VISION,
      response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0].message.content);
  }).catch(e => {
    console.error("Vision Failed:", e.message);
    return { isSafe: false, error: true };
  });
}

// --- 5. EMBEDDINGS (Google - text-embedding-004) ---
export async function generateEmbedding(textChunk) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODELS.EMBEDDING });
    
    const result = await model.embedContent({
      content: { parts: [{ text: textChunk }] },
      taskType: "RETRIEVAL_DOCUMENT" 
    });

    // Returns a 768-dimensional vector
    return result.embedding.values; 
  } catch (error) {
    console.error("Embedding Failed:", error.message);
    return null;
  }
}