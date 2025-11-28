import { Note } from '../models/Note.js';
import { User } from '../models/User.js'; // Make sure you import User
import { ModerationLog } from '../models/ModerationLog.js';

// --- 1. GET DASHBOARD STATS (The missing function) ---
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    
    // Calculate total downloads
    const downloadStats = await Note.aggregate([
      { $group: { _id: null, total: { $sum: "$downloads" } } }
    ]);
    const totalDownloads = downloadStats[0]?.total || 0;

    // Count pending notes
    const pendingNotes = await Note.countDocuments({ moderationStatus: { $in: ['pending', 'review'] } });

    // Fetch recent notes for the table
    const recentNotes = await Note.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('uploader', 'name');

    res.json({
      stats: {
        totalUsers,
        totalNotes,
        totalDownloads,
        pendingNotes
      },
      notes: recentNotes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. GET MODERATION QUEUE ---
export const getModerationQueue = async (req, res) => {
  try {
    // Find notes with status 'review' or 'blocked'
    const notes = await Note.find({ 
      moderationStatus: { $in: ['review', 'blocked'] } 
    }).lean();

    // Attach the Moderation Log details
    const notesWithLogs = await Promise.all(notes.map(async (note) => {
      const log = await ModerationLog.findOne({ noteId: note._id }).sort({ createdAt: -1 });
      return { ...note, moderationLog: log };
    }));

    res.json(notesWithLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. REVIEW NOTE (Approve/Block) ---
export const reviewNote = async (req, res) => {
  const { decision, adminComment } = req.body; 
  const { id } = req.params;

  try {
    const newStatus = decision === 'approve' ? 'safe' : 'blocked';
    
    // Update Note Status
    await Note.findByIdAndUpdate(id, { moderationStatus: newStatus });

    // Update Log
    await ModerationLog.findOneAndUpdate(
      { noteId: id },
      { 
        manualOverride: true,
        adminReviewer: req.user.id,
        adminComment: adminComment
      },
      { sort: { createdAt: -1 } }
    );

    res.json({ message: `Note marked as ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};