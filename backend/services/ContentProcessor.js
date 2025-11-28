import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import fs from 'fs';
import { driveClient } from '../utils/robotDrive.js'; 
import { Note } from '../models/Note.js';
import { NoteChunk } from '../models/NoteChunk.js';
import * as AIService from './AIService.js';

// --- Helper: Chunk Text ---
function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < text.length; i += (size - overlap)) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
}

// --- Helper: Stream to Buffer ---
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// --- Helper: Extract Text ---
export async function extractText(note) {
  try {
    let fullText = "";
    
    if (note.fileType === 'pdf' && note.driveFileId) {
      const stream = await driveClient.getFileStream(note.driveFileId);
      const buffer = await streamToBuffer(stream);
      const data = await pdfParse(buffer);
      fullText = data.text;
    } else if (note.description) {
      fullText = note.description; // Fallback
    } else if (note.title) {
      fullText = note.title; // Minimum fallback
    }
    
    return fullText.replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.error(`Extraction failed for note ${note._id}:`, err);
    return "";
  }
}

// --- Main Processing Workflow ---
export async function processNoteContent(noteId) {
  console.log(`[AI] Processing Note: ${noteId}`);
  const note = await Note.findById(noteId);
  if (!note) return;

  try {
    // 1. Extract Text
    const rawText = await extractText(note);
    if (!rawText || rawText.length < 50) {
      console.log(`[AI] Insufficient text for Note ${noteId}`);
      return;
    }

    // 2. Moderation Check
    const modResult = await AIService.moderate(rawText);
    if (!modResult.isSafe) {
      console.log(`[AI] Content Blocked for Note ${noteId}`);
      note.moderationStatus = 'blocked';
      await note.save();
      return; 
    }

    // 3. Generate Summary
    const summary = await AIService.summarize({ content: rawText, type: note.fileType });
    note.aiSummary = summary;
    note.moderationStatus = 'safe'; 
    await note.save();

    // 4. Generate Embeddings for Search
    await NoteChunk.deleteMany({ noteId: note._id });

    const textChunks = chunkText(rawText);
    let vectorCount = 0;

    for (let i = 0; i < Math.min(textChunks.length, 20); i++) { 
      const embedding = await AIService.embedText(textChunks[i]);
      if (embedding) {
        await NoteChunk.create({
          noteId: note._id,
          chunkText: textChunks[i],
          embedding,
          chunkIndex: i
        });
        vectorCount++;
      }
    }
    console.log(`[AI] Note ${noteId} processed. ${vectorCount} vectors created.`);

  } catch (error) {
    console.error(`[AI] Processing Failed for ${noteId}:`, error);
  }
}

// --- Semantic Search Logic ---
export async function semanticSearch(query) {
  const queryVector = await AIService.embedText(query);
  if (!queryVector) return [];

  const results = await NoteChunk.aggregate([
    {
      "$vectorSearch": {
        "index": "vector_index", 
        "path": "embedding",
        "queryVector": queryVector,
        "numCandidates": 50,
        "limit": 10
      }
    },
    {
      "$lookup": {
        "from": "notes",
        "localField": "noteId",
        "foreignField": "_id",
        "as": "note"
      }
    },
    { "$unwind": "$note" },
    { "$match": { "note.moderationStatus": "safe" } },
    {
      "$project": {
        "_id": 0,
        "note": 1,
        "score": { "$meta": "vectorSearchScore" },
        "snippet": "$chunkText"
      }
    }
  ]);

  return results;
}

// --- CRITICAL FIX: EXPORT ALIAS ---
// This allows 'noteController.js' to find 'processNoteQueue'
export const processNoteQueue = processNoteContent;