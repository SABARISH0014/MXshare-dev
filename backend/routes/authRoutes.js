import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
    getMe, 
    googleCallback, 
    refreshToken, 
    logout, 
    updateProfile, // <--- ENSURE THIS IS IMPORTED
    signup,  // <--- ADD THIS IMPORT
    login,    // <--- ADD THIS IMPORT
    getProfile // <--- Import the new function
} from '../controllers/authController.js';


const router = express.Router();

router.get('/me', authenticateJWT, getMe);
router.post('/google/callback', googleCallback);
router.post('/refresh', refreshToken);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// --- ENSURE THIS ROUTE EXISTS ---
router.put('/profile', authenticateJWT, updateProfile);
router.get('/profile', authenticateJWT, getProfile);
export default router;