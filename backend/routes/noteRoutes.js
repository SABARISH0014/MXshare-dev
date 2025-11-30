import express from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
    getAllNotes, 
    getHomepageNotes, 
    uploadLocalFile, 
    importFromDrive, 
    saveDriveReference, 
    getNoteById, 
    trackDownload, 
    getLeaderboard, 
    getUserHistory,
    cleanupDriveFile,
} from '../controllers/noteController.js';

import { getReviews, postReview } from '../controllers/reviewController.js';
import { reportNote } from "../controllers/reportController.js"; // ✅ Single import

// Multer Setup
const upload = multer({ dest: 'uploads/' }); 
const router = express.Router();

// ==========================================
// READ ROUTES
// ==========================================
router.get('/', getAllNotes);
router.get('/homepage', getHomepageNotes);
router.get('/leaderboard', getLeaderboard);
router.get('/history', authenticateJWT, getUserHistory);
router.get('/:id', getNoteById);

// ==========================================
// UPLOAD ROUTES
// ==========================================
router.post('/upload-local', authenticateJWT, upload.single('file'), uploadLocalFile);
router.post('/import-drive', authenticateJWT, importFromDrive);
router.post('/save-drive-reference', authenticateJWT, saveDriveReference);

// ==========================================
// CLEANUP & UTILS
// ==========================================
router.post('/drive-cleanup', authenticateJWT, cleanupDriveFile);

// ==========================================
// INTERACTIONS (Download & Report)
// ==========================================
router.post('/:id/download', authenticateJWT, trackDownload);
router.post('/:id/report', authenticateJWT, reportNote); // 👍 Works now

// ==========================================
// REVIEW ROUTES
// ==========================================
router.get('/:noteId/reviews', getReviews);
router.post('/:noteId/review', authenticateJWT, postReview);

export default router;
