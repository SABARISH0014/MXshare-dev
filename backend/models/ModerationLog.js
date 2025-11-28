import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  
  // The Exact 9-Category JSON Structure
  overall: {
    label: { type: String, enum: ['safe', 'review', 'block'] },
    max_score: Number,
    primary_category: String
  },
  categories: {
    hate_harassment: { score: Number, notes: String },
    violence_harm: { score: Number, notes: String },
    abusive_sexual: { score: Number, notes: String },
    illegal_dangerous: { score: Number, notes: String },
    misinformation: { score: Number, notes: String },
    child_safety: { score: Number, notes: String },
    privacy_sensitive: { score: Number, notes: String },
    copyright_ip: { score: Number, notes: String },
    user_intent: { 
      score: Number, 
      intent: { type: String }, 
      notes: String 
    }
  },
  
  // Admin Override Tracking
  manualOverride: { type: Boolean, default: false },
  adminReviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminComment: String,
  
}, { timestamps: true });

export const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);