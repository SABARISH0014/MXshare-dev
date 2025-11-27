import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { rerollQuest } from '../controllers/gamificationController.js';

const router = express.Router();

// POST /api/gamification/reroll
router.post('/reroll', authenticateJWT, rerollQuest);

export default router;