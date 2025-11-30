import fs from 'fs';
import { google } from 'googleapis';
import * as AIService from '../services/AIService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// ==========================================
// 1. SUGGEST METADATA (Local Upload)
// ==========================================
export const suggestMetadata = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    // 1. Read the file from disk
    const fileBuffer = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype;
    
    let suggestions;

    // 2. Logic Branch:
    // If it's a PDF or Image, Gemini can read it natively (Multimodal).
    // If it's a Word Doc or Text, we extract text first to be safe.
    
    if (mimeType.includes('pdf') || mimeType.includes('image')) {
        // --- MULTIMODAL PATH ---
        suggestions = await AIService.suggestMetadata(fileBuffer, mimeType);
    
    } else {
        // --- TEXT EXTRACTION PATH ---
        let text = "";
        
        if (mimeType.includes('word') || mimeType.includes('officedocument')) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            text = result.value;
        } else {
            text = fileBuffer.toString('utf8');
        }

        // Send extracted text as a Buffer with 'text/plain' mime
        const textBuffer = Buffer.from(text.substring(0, 10000)); // Limit context
        suggestions = await AIService.suggestMetadata(textBuffer, 'text/plain');
    }

    // 3. Cleanup & Response
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json(suggestions);

  } catch (error) {
    console.error("Metadata Suggestion Error:", error);
    // Cleanup if crash
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "AI suggestion failed" });
  }
};

// ==========================================
// 2. SUGGEST METADATA (Drive Picker)
// ==========================================
export const suggestDriveMetadata = async (req, res) => {
  try {
    const { fileId, googleToken, filename, mimeType } = req.body;
    console.log(`[Drive Analysis] Request for: ${filename} (${mimeType})`);

    if (!fileId || !googleToken) {
      return res.status(400).json({ message: "Missing Drive File ID or Token" });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Download File Buffer
    let buffer;
    try {
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );
        buffer = Buffer.from(response.data);
    } catch (driveErr) {
        console.error(`[Drive Analysis] Google API Error:`, driveErr.message);
        return res.status(500).json({ message: `Google Drive Error: ${driveErr.message}` });
    }

    let suggestions;

    // 2. Logic Branch (Same as local)
    if (mimeType.includes('pdf') || mimeType.includes('image')) {
        suggestions = await AIService.suggestMetadata(buffer, mimeType);
    } else {
        let text = "";
        // Basic extraction for drive files
        if (mimeType.includes('word') || filename.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            text = buffer.toString('utf8');
        }
        
        const textBuffer = Buffer.from(text.substring(0, 10000));
        suggestions = await AIService.suggestMetadata(textBuffer, 'text/plain');
    }

    res.json(suggestions);

  } catch (error) {
    console.error("[Drive Analysis] Critical Error:", error);
    res.status(500).json({ message: "Server Error during analysis" });
  }
};

// ==========================================
// 3. TEXT MODERATION
// ==========================================
export const moderateText = async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ message: "Text required" });
  
  const result = await AIService.moderateContent(text, 'text/plain');
  res.json(result);
};