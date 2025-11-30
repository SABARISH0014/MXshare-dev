import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { driveClient, robotDrive } from "../utils/robotDrive.js"; // Ensure robotDrive is imported for metadata
import { Note } from "../models/Note.js";
import { NoteChunk } from "../models/NoteChunk.js";
import { ModerationLog } from "../models/ModerationLog.js";
import * as AIService from "./AIService.js";

// Chunk helper
function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < text.length; i += (size - overlap)) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
}

// Stream helper
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// ---------------------------------------------------------
// 🛠️ HELPER: Vision OCR (Dynamic MimeType)
// ---------------------------------------------------------
async function runVisionOCR(buffer, mimeType) {
  try {
    console.log(`[AI] 🔍 Running Gemini Vision OCR for ${mimeType}...`);
    const base64File = buffer.toString("base64");

    const text = await AIService.visionOCR({
      prompt: "Extract all visible text from this educational document/image.",
      mimeType: mimeType, // ✅ NOW DYNAMIC (fixes the 'no pages' error)
      data: base64File,
    });

    return text?.trim() || "";
  } catch (err) {
    console.error("Vision OCR failed:", err.message);
    return "";
  }
}

// ---------------------------------------------------------
// 🧠 CORE: Extract Text & Generate Summary
// ---------------------------------------------------------
async function processFileContent(note) {
  let rawText = "";
  let aiSummary = "";
  
  if (!note.googleDriveFileId) return { rawText, aiSummary };

  try {
    // 1. Get File Metadata (to know the MimeType)
    const meta = await robotDrive.files.get({
        fileId: note.googleDriveFileId,
        fields: 'mimeType'
    });
    const mimeType = meta.data.mimeType;

    // 2. Get File Content (Buffer)
    const stream = await driveClient.getFileStream(note.googleDriveFileId);
    const buffer = await streamToBuffer(stream);

    console.log(`[AI] Processing File Type: ${mimeType}`);

    // --- CASE A: IMAGE (PNG, JPG, WEBP) ---
    if (mimeType.startsWith('image/')) {
        console.log("[AI] 🖼️ Image detected. Skipping PDF Parse.");
        
        // 1. OCR (Pass correct image mimeType)
        rawText = await runVisionOCR(buffer, mimeType);

        // 2. Visual Summary (Let Gemini look at the image buffer)
        // We pass the BUFFER, not the text, so it can see diagrams
        aiSummary = await AIService.summarizeContent(buffer, mimeType);
    } 
    
    // --- CASE B: PDF ---
    else if (mimeType === 'application/pdf') {
        console.log("[AI] 📄 PDF detected.");
        
        // 1. Try Cheap PDF Parse
        try {
            const parsed = await pdfParse(buffer);
            rawText = parsed.text?.replace(/\s+/g, " ").trim() || "";
        } catch (err) {
            console.log("PDF parse failed, switching to Vision...");
        }

        // 2. Fallback to Vision (Scanned PDF)
        if (!rawText || rawText.length < 60) {
            console.log("[AI] 👁️ Scanned PDF or Empty. Using Vision...");
            rawText = await runVisionOCR(buffer, "application/pdf");
        }

        // 3. Text-based Summary
        aiSummary = await AIService.summarizeContent(rawText || "No text extracted.", "text/plain");
    } 
    
    // --- CASE C: TEXT / OTHER ---
    else {
        rawText = buffer.toString('utf-8');
        aiSummary = await AIService.summarizeContent(rawText, "text/plain");
    }

  } catch (err) {
    console.error("[AI] Extraction Error:", err.message);
  }

  return { rawText, aiSummary };
}

// ---------------------------------------------------------
// 🚀 MAIN PIPELINE
// ---------------------------------------------------------
export async function processNoteContent(noteId) {
  console.log(`[AI] 🚀 Processing Note: ${noteId}`);
  const note = await Note.findById(noteId);
  if (!note) return;

  try {
    // 1. Extract Content (Smart Switch between Image/PDF)
    const { rawText, aiSummary } = await processFileContent(note);

    if ((!rawText || rawText.length < 20) && (!aiSummary || aiSummary.length < 20)) {
      console.log("[AI] ❌ Not enough content to index.");
      note.aiSummary = "Content could not be analyzed.";
      note.moderationStatus = "safe"; // Default to safe if empty
      await note.save();
      return;
    }

    // 2. Moderation (Check both extracted text and summary)
    console.log("[AI] 🛡 Moderating...");
    const textToCheck = (aiSummary + "\n" + rawText).substring(0, 3000);
    const mod = await AIService.moderateContent(textToCheck);

    await ModerationLog.create({
      noteId,
      status: mod.isSafe ? "safe" : "blocked",
      reason: mod.reason || null,
      confidence: mod.confidence || null,
    });

    if (!mod.isSafe) {
      note.moderationStatus = "blocked";
      await note.save();
      console.log("[AI] ⛔ Content Blocked.");
      return;
    }

    // 3. Save Summary
    console.log("[AI] ✍ Saving Summary...");
    note.aiSummary = aiSummary;
    note.moderationStatus = "safe";
    await note.save();

    // ... inside processNoteContent function ...

// 4. Generate Embeddings
if (rawText && rawText.length > 50) {
    // ... delete old chunks ...
    const chunks = chunkText(rawText);
    
    for (let i = 0; i < Math.min(chunks.length, 20); i++) {
        const embed = await AIService.generateEmbedding(chunks[i]);
        if (embed) {
            await NoteChunk.create({
                noteId,
                chunkText: chunks[i],
                embedding: embed,
                chunkIndex: i,
                
                // ✅ SAVE METADATA TO CHUNK
                subject: note.subject,
                semester: note.semester
            });
        }
    }
}

    console.log(`[AI] ✅ Done Processing: ${noteId}`);
  } catch (err) {
    console.error("Pipeline failed", err);
    note.aiSummary = "AI failed during analysis.";
    await note.save();
  }
}

export const processNoteQueue = processNoteContent;