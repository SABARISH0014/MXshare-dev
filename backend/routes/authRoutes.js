import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { getMe, googleCallback, refreshToken, logout } from '../controllers/authController.js';

const router = express.Router();

router.get('/me', authenticateJWT, getMe);
router.post('/google/callback', googleCallback);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;