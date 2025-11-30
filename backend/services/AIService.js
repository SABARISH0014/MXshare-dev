import { GoogleGenerativeAI } from '@google/generative-ai';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import dotenv from 'dotenv';
import { createRequire } from 'module'; // Needed for pdf-parse in ES Modules

dotenv.config();

// Initialize Require for CommonJS libraries
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Using Flash for speed and multimodal capabilities
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
    return { isSafe: true, categories: ["fallback"] }; 
  }
}

// ==============================
// 3️⃣ Metadata Suggestion (ROBUST VERSION)
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

    let parts = [];

    // --- LOGIC: SPLIT BY FILE TYPE ---
    
    // CASE A: IMAGE (PNG, JPG, WEBP)
    if (mimeType.startsWith('image/')) {
        console.log(`[AI] 🖼️ Processing Image: ${mimeType}`);
        parts = [
            prompt,
            {
                inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType: mimeType // ✅ Sends "image/png" explicitly
                }
            }
        ];
    }
    
    // CASE B: PDF (Try Text extraction first, then Vision)
    else if (mimeType === 'application/pdf') {
        console.log(`[AI] 📄 Processing PDF...`);
        let pdfText = '';
        
        try {
            // Optimization: Try to read text directly (Cheaper/Faster)
            const pdfData = await pdfParse(fileBuffer);
            if (pdfData.text && pdfData.text.length > 50) {
                pdfText = pdfData.text.substring(0, 15000); // Limit context
                console.log("[AI] Text extracted from PDF. Using text mode.");
            }
        } catch (e) {
            console.log("[AI] PDF Parse failed. Switching to Vision.");
        }

        if (pdfText) {
            parts = [prompt, pdfText];
        } else {
            console.log("[AI] 👁️ Using Gemini Vision for Scanned PDF...");
            parts = [
                prompt,
                {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType: "application/pdf"
                    }
                }
            ];
        }
    }
    
    // CASE C: PLAIN TEXT / CODE
    else {
        console.log(`[AI] 📝 Processing Text File...`);
        const textContent = fileBuffer.toString("utf-8");
        parts = [prompt, textContent.substring(0, 5000)];
    }

    

    // --- EXECUTE AI ---
    const result = await visionModel.generateContent(parts);

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
      description: "Auto-generation failed.",
      subject: "",
      semester: "",
      tags: []
    };
  }
}

// ... (imports remain the same)

// ==============================
// 4️⃣ Text/Visual Summary (UPDATED)
// ==============================
async function summarizeContent(textOrBuffer, mimeType = 'text/plain') {
  try {
    // CASE A: Plain Text Summary
    if (mimeType === 'text/plain' || typeof textOrBuffer === 'string') {
        const result = await visionModel.generateContent(
            `Summarize this educational content for a student in 3 bullet points:\n${textOrBuffer.substring(0, 10000)}`
        );
        return result.response.text();
    }

    // CASE B: Visual Summary (For Images/Single Page)
    // This allows Gemini to "look" at the image and summarize diagrams/notes directly
    console.log(`[AI] 👁️ Generating Visual Summary for ${mimeType}...`);
    
    const prompt = `
      Look at this educational image (notes, diagram, or slide).
      Provide a concise summary of the key concepts shown.
      If it contains text, summarize the text.
      If it is a diagram, explain what it demonstrates.
    `;

    const result = await visionModel.generateContent([
        prompt,
        {
            inlineData: {
                data: textOrBuffer.toString("base64"),
                mimeType: mimeType 
            }
        }
    ]);

    return result.response.text();

  } catch (err) {
    console.error("Summary failed:", err.message);
    return "Summary unavailable.";
  }
}

// ==============================
// 5️⃣ Vision OCR (FIXED)
// ==============================
async function visionOCR({ prompt, mimeType, data }) {
  try {
    // Safety check: Ensure mimeType matches the data
    if (!mimeType || (!mimeType.startsWith('image/') && mimeType !== 'application/pdf')) {
        console.warn(`[OCR] Warning: Invalid mimeType ${mimeType} for Vision. Defaulting to text.`);
        return "";
    }

    const result = await visionModel.generateContent([
      prompt || "Extract all readable text from this educational image/document verbatim.",
      {
        inlineData: {
          data,
          mimeType, 
        },
      },
    ]);

    const extracted = result.response.text().replace(/```/g, "").trim();
    return extracted || "";

  } catch (err) {
    // Handle "Document has no pages" error specifically
    if (err.message.includes("document has no pages")) {
        console.error("[OCR Error] Mismatch: Tried to read Image as PDF.");
    } else {
        console.error("Vision OCR failed:", err.message);
    }
    return "";
  }
}

// ... (exports remain the same)
// ==============================
// ✔ Export
// ==============================
export {
  generateEmbedding,
  moderateContent,
  suggestMetadata,
  summarizeContent,
  loadEmbeddingModel,
  visionOCR
};