import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 }
}, { timestamps: true });

export const Review = mongoose.model('Review', ReviewSchema);