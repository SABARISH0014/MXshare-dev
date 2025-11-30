// --- REPORT NOTE (User Flagging) ---
import Report from "../models/Report.js";
import { Note } from "../models/Note.js";

export const reportNote = async (req, res) => {
  try {
    const { reason, message } = req.body;
    const noteId = req.params.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Login required to report content." });
    }

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // 🔹 Create Report Entry in DB
    await Report.create({
      note: noteId,
      user: req.user.id,
      reason,
      message
    });

    // Flag note for review only first time
    if (note.moderationStatus !== "review") {
      note.moderationStatus = "review";
      await note.save();
    }

    return res.json({ message: "Report submitted. Under review by admin." });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};
