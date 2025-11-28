import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import * as AIService from '../services/AIService.js';

/**
 * Endpoint: POST /api/ai/suggest-titles
 * Usage: Frontend sends the file, we return 3 titles instantly.
 * This is totally separate from the database saving process.
 */
export const suggestTitlesOnDemand = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    let textToAnalyze = "";

    // 1. Extract Text (Quickly - First 5k chars only)
    // We optimize for speed here since the user is waiting.
    if (req.file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        textToAnalyze = pdfData.text.substring(0, 5000); 
    } else {
        // Fallback or Image handling can go here
        return res.json({ titles: ["Untitled Document", "New Upload"] });
    }

    // 2. Call AI (Gemini 2.5 Flash)
    const titles = await AIService.suggestTitles(textToAnalyze);

    // 3. Cleanup Temp File
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ titles });

  } catch (error) {
    console.error("Title Gen Error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Failed to generate titles", titles: [] });
  }
};