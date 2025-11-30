import express from 'express';
import multer from 'multer';
import * as aiController from '../controllers/aiController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for local files

// 1. Local File Suggestion (When uploading from computer)
router.post('/suggest-metadata', 
    authenticateJWT, 
    upload.single('file'), 
    aiController.suggestMetadata
);

// 2. Drive File Suggestion (When picking from Google Drive)
// This route handles the new logic to download & analyze Drive files
router.post('/suggest-drive-metadata', 
    authenticateJWT, 
    aiController.suggestDriveMetadata
);

// 3. Quick text moderation (For comments, bios, etc.)
router.get('/moderate', authenticateJWT, aiController.moderateText);

export default router;