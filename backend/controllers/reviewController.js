import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Note } from '../models/Note.js';

export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ note: req.params.noteId }).populate('user', 'name').sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    return res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
};

export const postReview = async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const noteId = req.params.noteId;
    const userId = req.user.id;

    const newReview = new Review({ note: noteId, user: userId, rating, comment });
    await newReview.save();

    const stats = await Review.aggregate([
      { $match: { note: new mongoose.Types.ObjectId(noteId) } },
      { $group: { _id: '$note', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Note.findByIdAndUpdate(noteId, {
        avgRating: Number(stats[0].avgRating.toFixed(1)),
        reviewCount: stats[0].reviewCount
      });
    }

    const populatedReview = await Review.findById(newReview._id).populate('user', 'name');
    return res.status(201).json(populatedReview);
  } catch (err) {
    console.error('Post review error:', err);
    return res.status(500).json({ message: 'Failed to save review.' });
  }
};