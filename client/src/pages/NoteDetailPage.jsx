import React, { useState, useEffect, useContext } from 'react';
import { User, Calendar, Eye, Star } from 'lucide-react';
import { Button } from '../components/ui/Primitives';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../data/constants';

const NoteDetailPage = ({ note }) => {
    const { addToast } = useContext(ToastContext);
    const { authToken } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [review, setReview] = useState({ rating: 0, comment: '' });
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

    useEffect(() => {
      if (note?._id) { 
        fetch(`${API_BASE_URL}/api/notes/${note._id}/reviews`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setReviews(data); })
          .catch(err => addToast('Failed to load reviews.', 'error'));
      }
    }, [note?._id, addToast, authToken]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (review.rating === 0) { addToast('Please provide a star rating.', 'error'); return; }
        setIsReviewSubmitting(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/notes/${note._id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ rating: review.rating, comment: review.comment })
          });
          const newReviewData = await res.json();
          if (res.ok) {
            addToast('Review submitted successfully!', 'success');
            setReviews(prev => [newReviewData, ...prev]);
            setReview({ rating: 0, comment: '' });
          } else {
            addToast(newReviewData.message || 'Failed to submit review.', 'error');
          }
        } catch (err) {
          addToast('Network error submitting review.', 'error');
        } finally {
          setIsReviewSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 space-y-3">
                <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-3">Note Details</h3>
                <p className="flex items-center text-sm text-gray-300"><User className="w-4 h-4 mr-3 text-blue-500" /><span className="font-semibold">Contributor:</span> {note.uploader ? note.uploader.name : '...'}</p>
                <p className="flex items-center text-sm text-gray-300"><Calendar className="w-4 h-4 mr-3 text-blue-500" /><span className="font-semibold">Uploaded:</span> {new Date(note.createdAt).toLocaleDateString()}</p>
                <p className="flex items-center text-sm text-gray-300"><Eye className="w-4 h-4 mr-3 text-blue-500" /><span className="font-semibold">Downloads:</span> {note.downloads}</p>
                <p className="flex items-center text-sm text-gray-300"><Star className="w-4 h-4 mr-3 text-yellow-500" /><span className="font-semibold">Avg Rating:</span> {note.avgRating ? note.avgRating.toFixed(1) : 0} ({note.reviewCount || 0} Reviews)</p>
            </div>
            {/* Add Review Form and List logic here similar to your original code */}
        </div>
    );
};

export default NoteDetailPage;