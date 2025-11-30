import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },

  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Google Drive + Web file types
  googleDriveFileId: { type: String },
  websiteUrl: { type: String },
  thumbnailUrl: { type: String },
  videoUrl: { type: String },

  tags: { type: [String], default: [] },

  // AI Processing Fields
  aiSummary: { type: String },
  moderationStatus: {
    type: String,
    enum: ["pending", "safe", "blocked", "error"],
    default: "pending",
  },
  hasEmbeddings: { type: Boolean, default: false },
  fileType: { type: String, default: "pdf" },

  // Stats
  downloads: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Note = mongoose.model('Note', NoteSchema);
