import express from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
    getAllNotes, 
    getHomepageNotes, 
    uploadLocalFile, 
    importFromDrive, 
    saveDriveReference 
} from '../controllers/noteController.js';
import { getReviews, postReview } from '../controllers/reviewController.js';

const upload = multer({ dest: 'uploads/' }); 
const router = express.Router();

// Get Routes
router.get('/', getAllNotes);
router.get('/homepage', getHomepageNotes);

// Upload Routes
router.post('/upload-local', authenticateJWT, upload.single('file'), uploadLocalFile);
router.post('/import-drive', authenticateJWT, importFromDrive);
router.post('/save-drive-reference', authenticateJWT, saveDriveReference);

// Review Routes
router.get('/:noteId/reviews', getReviews);
router.post('/:noteId/review', authenticateJWT, postReview);

export default router;