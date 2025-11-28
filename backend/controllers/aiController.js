import fs from 'fs';
import * as AIService from '../services/AIService.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// POST /api/ai/suggest-metadata
// Used in the Upload Form before final submission
export const suggestMetadata = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    // 1. Quick text extract
    const dataBuffer = fs.readFileSync(req.file.path);
    let text = "";
    
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text.substring(0, 3000);
    } else {
      text = dataBuffer.toString('utf8').substring(0, 3000); // Fallback for text files
    }

    // 2. Call AI
    const suggestions = await AIService.suggestMetadata({
      rawText: text,
      originalFilename: req.file.originalname
    });

    // 3. Cleanup
    fs.unlinkSync(req.file.path);

    res.json(suggestions);
  } catch (error) {
    console.error("Metadata Suggestion Error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "AI suggestion failed" });
  }
};

// GET /api/ai/moderate-text?text=...
export const moderateText = async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ message: "Text required" });
  
  const result = await AIService.moderate(text);
  res.json(result);
};