import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  googleDriveFileId: { type: String, required: false }, 
  websiteUrl: { type: String, trim: true, default: '' },
  videoUrl: { type: String, trim: true, default: '' },
  tags: { type: [String], default: [] },
  downloads: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Note = mongoose.model('Note', NoteSchema);