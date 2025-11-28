import express from 'express';
import multer from 'multer';
import * as aiController from '../controllers/aiController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Auto-fill title/tags from file
router.post('/suggest-metadata', 
    authenticateJWT, 
    upload.single('file'), 
    aiController.suggestMetadata
);

// Quick text check (for comments or bio)
router.get('/moderate', authenticateJWT, aiController.moderateText);

export default router;