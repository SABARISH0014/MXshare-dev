import express from 'express';
import multer from 'multer';
import * as aiController from '../controllers/aiController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for on-demand analysis

// POST /api/ai/suggest-titles
// Used by the Frontend Upload Form
router.post('/suggest-titles', 
    authenticateJWT, 
    upload.single('file'), 
    aiController.suggestTitlesOnDemand
);

export default router;