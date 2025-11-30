import Report from "../models/Report.js";

export const reportNote = async (req, res) => {
  try {
    const { reason, message } = req.body;
    const noteId = req.params.id;

    // Require login
    if (!req.user) {
      return res.status(401).json({ message: "Login required" });
    }

    // Create report entry
    const newReport = await Report.create({
      note: noteId,
      user: req.user.id,
      reason,
      message
    });

    console.log("📌 Report saved:", newReport._id);

    return res.json({
      message: "Report submitted successfully."
    });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};

