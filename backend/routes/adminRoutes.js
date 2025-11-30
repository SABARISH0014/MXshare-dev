import express from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticateJWT, restrictToAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect All Routes
router.use(authenticateJWT, restrictToAdmin);

// Dashboard
router.get("/dashboard-data", adminController.getDashboardStats);

// Moderation Queue
router.get("/queue", adminController.getModerationQueue);

// Manual Review
router.post("/review/:id", adminController.reviewNote);

/* 🚨 REPORTS */
router.get("/reports", adminController.getReports);
router.post("/reports/:reportId/resolve", adminController.resolveReport);
router.post("/reports/:reportId/block-note", adminController.blockReportedNote);

export default router;
