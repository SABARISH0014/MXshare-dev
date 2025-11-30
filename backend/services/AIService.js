import { GoogleGenerativeAI } from '@google/generative-ai';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let embeddingModel = null;

// ==============================
// 1️⃣ Embedding Model Loader
// ==============================
async function loadEmbeddingModel() {
  if (!embeddingModel) {
    await tf.setBackend('cpu');
    await tf.ready();
    embeddingModel = await use.load();
  }
  return embeddingModel;
}

async function generateEmbedding(text) {
  try {
    if (!text?.trim()) return null;
    const model = await loadEmbeddingModel();
    const tensors = await model.embed(text);
    const vector = await tensors.array();
    tensors.dispose();
    return vector[0];
  } catch (err) {
    console.error("Embedding error:", err.message);
    return null;
  }
}

// ==============================
// 🧠 Semester Value Normalizer
// ==============================
const normalizeSemester = (value) => {
  if (!value) return "";
  const digit = String(value).match(/\d/);
  return digit ? digit[0] : "";
};

// ==============================
// 2️⃣ Moderation Logic
// ==============================
async function moderateContent(textOrBuffer, mimeType = 'text/plain') {
  try {
    const prompt = `
      You are a strict safety checker.
      Analyze: hate, nudity, sexual minors, violence, harassment.
      
      Respond ONLY JSON. No explanations. No markdown.
      Format:
      {"isSafe": true, "categories": []}
    `;

    const result = await visionModel.generateContent([
      prompt,
      mimeType === "text/plain"
        ? textOrBuffer.substring(0, 3000)
        : { inlineData: { data: textOrBuffer.toString("base64"), mimeType } }
    ]);

    let output = result.response.text()
      .replace(/```json|```/g, "")
      .trim();

    // Fallback: extract the first valid JSON object if text includes extra content
    const match = output.match(/\{[\s\S]*\}/);
    if (match) output = match[0];

    const json = JSON.parse(output);
    return json;

  } catch (err) {
    console.warn("[Moderation Parsing Warning]:", err.message);
    return { isSafe: true, categories: ["fallback"] }; // Don’t block the pipeline
  }
}


// ==============================
// 3️⃣ Metadata Suggestion
// ==============================
async function suggestMetadata(fileBuffer, mimeType) {
  try {
    const prompt = `
      Analyze this document/image.
      Extract:
      - Title
      - Description (2 sentences)
      - Subject (from MCA syllabus)
      - Semester (1-4) → digit
      - 5 Tags

      Return ONLY JSON:
      {
        "title": "...",
        "description": "...",
        "subject": "...",
        "semester": "...",
        "tags": ["..."]
      }
    `;

    const result = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType
        }
      }
    ]);

    const cleanText = result.response.text().replace(/```json|```/g, "").trim();
    let json = JSON.parse(cleanText);

    json.semester = normalizeSemester(json.semester);

    return {
      title: json.title || "",
      description: json.description || "",
      subject: json.subject || "",
      semester: json.semester || "",
      tags: json.tags || []
    };

  } catch (err) {
    console.error("Metadata Suggestion Error:", err);
    return {
      title: "",
      description: "",
      subject: "",
      semester: "",
      tags: []
    };
  }
}

// ==============================
// 4️⃣ Text Summary
// ==============================
async function summarizeContent(text) {
  try {
    const result = await visionModel.generateContent(
      `Summarize for students:\n${text.substring(0, 5000)}`
    );
    return result.response.text();
  } catch {
    return "Summary unavailable.";
  }
}

// ==============================
// 5️⃣ Vision OCR (PDF/Image Text Extraction)
// ==============================
async function visionOCR({ prompt, mimeType, data }) {
  try {
    const result = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          data,
          mimeType,
        },
      },
    ]);

    const extracted = result.response.text()
      .replace(/```/g, "")
      .trim();

    return extracted || "";
  } catch (err) {
    console.error("Vision OCR failed:", err.message);
    return "";
  }
}


// ==============================
// ✔ Single Proper Export Block
// ==============================
export {
  generateEmbedding,
  moderateContent,
  suggestMetadata,
  summarizeContent,
  loadEmbeddingModel,
  visionOCR
};
