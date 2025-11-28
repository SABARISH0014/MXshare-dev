import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateJWT, restrictToAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GLOBAL GUARD: All routes require Admin Token
router.use(authenticateJWT, restrictToAdmin);

// 1. Dashboard Overview
router.get('/dashboard-data', adminController.getDashboardStats);

// 2. Moderation Queue
router.get('/queue', adminController.getModerationQueue);

// 3. Review Action
router.post('/review/:id', adminController.reviewNote);

export default router;