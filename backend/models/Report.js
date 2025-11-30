import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reason: { type: String, required: true },
    message: { type: String, default: "" },

    // Admin action
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending"
    },
    adminComment: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// 🔄 Auto populate on every find()
reportSchema.pre(/^find/, function (next) {
  this.populate("note", "title moderationStatus thumbnailUrl")
      .populate("user", "name email");
  next();
});

const Report = mongoose.model("Report", reportSchema);
export default Report;
