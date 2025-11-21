import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  
  // Link to User
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Google Drive Specifics
  googleDriveFileId: { type: String }, 
  websiteUrl: { type: String }, 
  thumbnailUrl: { type: String },
  
  videoUrl: { type: String },
  tags: { type: [String], default: [] },
  
  // Stats
  downloads: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

// --- CRITICAL: Must be a Named Export ---
export const Note = mongoose.model('Note', NoteSchema);