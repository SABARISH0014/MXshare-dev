import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import { Note } from '../models/Note.js'; 
import { NoteChunk } from '../models/NoteChunk.js';
import { ModerationLog } from '../models/ModerationLog.js';
import * as AIService from './AIService.js';
import { driveClient } from '../utils/robotDrive.js';

// Helper for stream conversion
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Helper: Extract Full Text
async function extractContent(note) {
  if (note.fileType === 'pdf') {
    const stream = await driveClient.getFileStream(note.driveFileId);
    const buffer = await streamToBuffer(stream);
    const data = await pdfParse(buffer);
    return data.text; 
  } 
  return ""; 
}

/**
 * ORCHESTRATOR: Manages the distinct AI workflows
 */
export async function processNoteQueue(noteId) {
  console.log(`[Processor] 🚀 Processing Note: ${noteId}`);
  
  try {
    const note = await Note.findById(noteId);
    if (!note) return;

    // 1. EXTRACT TEXT
    let fullText = await extractContent(note);

    // 2. VISION CHECK (If Image/Video) - Uses Gemini 2.5 Pro
    if (note.fileType === 'image' || note.fileType === 'video_link') {
       // ... fetch image buffer ...
       // const visionRes = await AIService.analyzeImage(base64);
       // if (!visionRes.isSafe) { ... block ... return; }
    }

    if (!fullText) {
      console.log("No text extracted.");
      return;
    }

    // 3. EXECUTE INDIVIDUAL PROCESSES
    // We run them in parallel for efficiency, but they are separate calls
    console.log("[Processor] 🧠 Calling AI Models (Summary & Moderation)...");
    
    const [moderationRes, summaryRes] = await Promise.all([
        AIService.moderateContent(fullText), // Flash (Safety)
        AIService.generateSummary(fullText)  // Pro (For Preview Page)
    ]);

    // 4. SAVE METADATA
    
    // Save Safety Log
    await ModerationLog.create({
      noteId: note._id,
      overall: moderationRes.overall,
      categories: moderationRes.categories
    });

    // Save Summary for Preview Page
    note.aiSummary = summaryRes; 
    note.moderationStatus = moderationRes.overall.label;
    note.fullTextContent = fullText; 
    await note.save();

    console.log(`[Processor] ✅ Metadata Saved. Summary available for Preview.`);

    // 5. GENERATE EMBEDDINGS (For Search)
    // Only if content is Safe
    if (note.moderationStatus !== 'blocked') {
      console.log("[Processor] 🔢 Generating Embeddings (text-embedding-004)...");
      
      const chunks = fullText.match(/.{1,1000}/g) || []; // 1000 chars per chunk
      
      for (let i = 0; i < chunks.length; i++) {
        const vector = await AIService.generateEmbedding(chunks[i]);
        if (vector) {
          await NoteChunk.create({
            noteId: note._id,
            chunkText: chunks[i],
            embedding: vector, 
            chunkIndex: i
          });
        }
      }
      console.log(`[Processor] ✅ Vectors Created for Search.`);
    }

  } catch (error) {
    console.error(`[Processor] ❌ Error:`, error);
  }
}