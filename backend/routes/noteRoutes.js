import express from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
    getAllNotes, 
    getHomepageNotes, 
    uploadLocalFile,      // <--- Matches the new controller export
    importFromDrive,      // <--- Matches the new controller export
    saveDriveReference,
    getNoteById,     // <--- ADD THIS
    trackDownload,    // <--- Matches the new controller export
    getLeaderboard, // Ensure this is imported
    getUserHistory // Ensure this is imported
} from '../controllers/noteController.js';
import { getReviews, postReview } from '../controllers/reviewController.js';

// Configure Multer to store files temporarily in 'uploads/' folder
const upload = multer({ dest: 'uploads/' }); 

const router = express.Router();

// --- READ ROUTES ---
router.get('/', getAllNotes);
router.get('/homepage', getHomepageNotes);
router.get('/leaderboard', getLeaderboard); // <--- MOVED UP (Before /:id)
router.get('/history', authenticateJWT, getUserHistory); // <--- MUST BE HERE (Before /:id)
router.get('/:id', getNoteById); // <--- NEW: Get Single Note

// --- UPLOAD ROUTES ---
// 1. For files uploaded from Computer (uses Multer)
router.post('/upload-local', authenticateJWT, upload.single('file'), uploadLocalFile);

// 2. For files picked from Google Drive (JSON body)
router.post('/import-drive', authenticateJWT, importFromDrive);

// 3. For Video Links (JSON body)
router.post('/save-drive-reference', authenticateJWT, saveDriveReference);

// Interactions
router.post('/:id/download', authenticateJWT, trackDownload);

// --- REVIEW ROUTES ---
router.get('/:noteId/reviews', getReviews);
router.post('/:noteId/review', authenticateJWT, postReview);

export default router;