import Report from "../models/Report.js";
import { Note } from "../models/Note.js";

export const reportNote = async (req, res) => {
  try {
    const { id } = req.params; // note ID
    const { reason, message } = req.body;
    const userId = req.user.id;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    await Report.create({
      note: id,
      user: userId,
      reason,
      message
    });

    await Note.findByIdAndUpdate(id, {
      moderationStatus: "review"
    });

    return res.json({ message: "Report submitted successfully" });
  } catch (err) {
    console.error("Report API Error:", err);
    res.status(500).json({ message: "Failed to submit report" });
  }
};
