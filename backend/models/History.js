import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  lastAccessed: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    collection: 'histories' // <--- EXPLICITLY SET COLLECTION NAME
});

// Compound index: Ensure a user has only one entry per note
HistorySchema.index({ user: 1, note: 1 }, { unique: true });

export const History = mongoose.model('History', HistorySchema);