import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
    getMe, 
    googleCallback, 
    refreshToken, 
    logout, 
    updateProfile // <--- ENSURE THIS IS IMPORTED
} from '../controllers/authController.js';

const router = express.Router();

router.get('/me', authenticateJWT, getMe);
router.post('/google/callback', googleCallback);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// --- ENSURE THIS ROUTE EXISTS ---
router.put('/profile', authenticateJWT, updateProfile);

export default router;