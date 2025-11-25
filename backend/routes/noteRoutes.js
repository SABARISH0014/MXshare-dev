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
    cleanupDriveFile // <--- 1. ADD THIS IMPORT
} from '../controllers/noteController.js';
import { getReviews, postReview } from '../controllers/reviewController.js';

// Configure Multer to store files temporarily in 'uploads/' folder
const upload = multer({ dest: 'uploads/' }); 

const router = express.Router();

// --- READ ROUTES ---
router.get('/', getAllNotes);
router.get('/homepage', getHomepageNotes);
router.get('/leaderboard', getLeaderboard);
router.get('/history', authenticateJWT, getUserHistory);
router.get('/:id', getNoteById);

// --- UPLOAD ROUTES ---
router.post('/upload-local', authenticateJWT, upload.single('file'), uploadLocalFile);
router.post('/import-drive', authenticateJWT, importFromDrive);
router.post('/save-drive-reference', authenticateJWT, saveDriveReference);

// --- CLEANUP ROUTE (Fixes CORS issue) ---
// 2. ADD THIS ROUTE
router.post('/drive-cleanup', authenticateJWT, cleanupDriveFile);

// Interactions
router.post('/:id/download', authenticateJWT, trackDownload);

// --- REVIEW ROUTES ---
router.get('/:noteId/reviews', getReviews);
router.post('/:noteId/review', authenticateJWT, postReview);

export default router;