import { Note } from "../models/Note.js";
import { User } from "../models/User.js";
import Report from "../models/Report.js";
import { ModerationLog } from "../models/ModerationLog.js";

/* ==============================
 📊 DASHBOARD OVERVIEW
============================== */
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    const totalReports = await Report.countDocuments({ status: "pending" });

    const downloadStats = await Note.aggregate([
      { $group: { _id: null, total: { $sum: "$downloads" } } }
    ]);
    const totalDownloads = downloadStats[0]?.total || 0;

    const pendingNotes = await Note.countDocuments({
      moderationStatus: { $in: ["review", "processing"] }
    });

    const recentNotes = await Note.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("uploader", "name");

    res.json({
      stats: {
        totalUsers,
        totalNotes,
        totalDownloads,
        totalReports,
        pendingNotes
      },
      notes: recentNotes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ==============================
  ⚠️ AI MODERATION QUEUE
============================== */
export const getModerationQueue = async (req, res) => {
  try {
    // FIX: Only fetch 'review' (AI Flagged) or 'pending'.
    // REMOVE 'blocked' from this list, otherwise processed items stay in the queue.
    const notes = await Note.find({
      moderationStatus: "review" 
    }).lean();

    const enriched = await Promise.all(
      notes.map(async (note) => {
        const log = await ModerationLog.findOne({ noteId: note._id }).sort({
          createdAt: -1
        });
        return { ...note, moderationLog: log };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ==============================
  🚩 REPORT SYSTEM
============================== */

// Fetch Only Pending Reports
export const getReports = async (req, res) => {
  try {
    // FIX: Filter by status: 'pending' so resolved reports disappear
    const reports = await Report.find({ status: "pending" })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/* ==============================
 🛡 APPROVE or BLOCK NOTE
============================== */
export const reviewNote = async (req, res) => {
  const { decision, adminComment } = req.body;
  const { id } = req.params;

  try {
    const newStatus = decision === "approve" ? "safe" : "blocked";

    await Note.findByIdAndUpdate(id, { moderationStatus: newStatus });

    await ModerationLog.findOneAndUpdate(
      { noteId: id },
      {
        manualOverride: true,
        adminReviewer: req.user.id,
        adminComment
      },
      { sort: { createdAt: -1 } }
    );

    res.json({ message: `Note marked as ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resolve a report
export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { adminComment } = req.body;

    await Report.findByIdAndUpdate(reportId, {
      status: "resolved",
      adminComment
    });

    res.json({ message: "Report resolved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Block note directly from report section
export const blockReportedNote = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) return res.status(404).json({ message: "Report not found" });

    await Note.findByIdAndUpdate(report.note._id, {
      moderationStatus: "blocked"
    });

    report.status = "resolved";
    report.adminComment = "Note blocked due to violation";
    await report.save();

    res.json({ message: "Note blocked and report resolved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
