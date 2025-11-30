import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { driveClient } from "../utils/robotDrive.js";
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

// OCR fallback function using Gemini Vision
async function runVisionOCR(buffer) {
  try {
    console.log("[AI] 🔍 Running Gemini Vision OCR...");
    const base64File = buffer.toString("base64");

    const text = await AIService.visionOCR({
      prompt: "Extract all text from this document.",
      mimeType: "application/pdf",
      data: base64File,
    });

    return text?.trim() || "";
  } catch (err) {
    console.error("Vision OCR failed:", err);
    return "";
  }
}

// Extract text with OCR fallback
async function extractText(note) {
  let text = "";

  if (note.googleDriveFileId) {
    const stream = await driveClient.getFileStream(note.googleDriveFileId);
    const buffer = await streamToBuffer(stream);

    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text?.replace(/\s+/g, " ").trim() || "";
    } catch (err) {
      console.log("PDF parse failed, trying OCR...");
    }

    if (!text || text.length < 60) {
      text = await runVisionOCR(buffer);
    }
  }
  return text;
}

// MAIN PIPELINE
export async function processNoteContent(noteId) {
  console.log(`[AI] 🚀 Processing Note: ${noteId}`);
  const note = await Note.findById(noteId);
  if (!note) return;

  try {
    let rawText = await extractText(note);

    if (!rawText || rawText.length < 40) {
      console.log("[AI] ❌ Not enough text");
      note.aiSummary = "AI could not extract readable text.";
      note.moderationStatus = "safe";
      await note.save();
      return;
    }

    console.log("[AI] 🛡 Moderating...");
    const mod = await AIService.moderateContent(rawText);

    await ModerationLog.create({
      noteId,
      status: mod.isSafe ? "safe" : "blocked",
      reason: mod.reason || null,
      confidence: mod.confidence || null,
    });

    if (!mod.isSafe) {
      note.moderationStatus = "blocked";
      await note.save();
      return;
    }

    console.log("[AI] ✍ Summarizing...");
    note.aiSummary = await AIService.summarizeContent(rawText);
    note.moderationStatus = "safe";
    await note.save();

    console.log("[AI] 🔎 Embeddings...");
    await NoteChunk.deleteMany({ noteId });

    const chunks = chunkText(rawText);
    for (let i = 0; i < Math.min(chunks.length, 20); i++) {
      const embed = await AIService.generateEmbedding(chunks[i]);
      if (embed) {
        await NoteChunk.create({
          noteId,
          chunkText: chunks[i],
          embedding: embed,
          chunkIndex: i,
        });
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
