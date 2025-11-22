import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Download, User, Calendar, Star, MessageSquare, 
    ArrowLeft, FileText, Eye, Share2, ExternalLink 
} from 'lucide-react';
import axios from 'axios';

import { Button } from '../components/ui/primitives'; 
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { API_BASE_URL } from '../data/constants';

const NoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authToken } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const noteRes = await axios.get(`${API_BASE_URL}/api/notes/${id}`);
        setNote(noteRes.data);
        const reviewRes = await axios.get(`${API_BASE_URL}/api/notes/${id}/reviews`);
        setReviews(reviewRes.data);
      } catch (err) {
        console.error(err);
        addToast("Failed to load note.", "error");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, addToast]);

  // --- 2. LOGIC: PREVIEW (View Only) ---
  const handlePreview = () => {
    // Just open the link. Do not count as a download.
    const targetUrl = note.videoUrl || note.websiteUrl;
    
    if (targetUrl) {
        window.open(targetUrl, '_blank');
    } else {
        addToast("Preview link not available.", "error");
    }
  };

  // --- 3. LOGIC: DOWNLOAD (Track + Force Save) ---
  const handleDownload = async () => {
    try {
      // A. Track in Database (Increment Count + Save History)
      await axios.post(
        `${API_BASE_URL}/api/notes/${id}/download`, 
        {}, 
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      // B. Update UI
      setNote(prev => ({ ...prev, downloads: prev.downloads + 1 }));
      addToast("Starting download...", "success");
      
      // C. Generate Direct Link
      if (note.videoUrl) {
        // Videos usually can't be forced downloaded easily, so we open them
        window.open(note.videoUrl, '_blank');
      } 
      else if (note.googleDriveFileId) {
        // MAGIC LINK: Converts a View link into a Direct Download link
        const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${note.googleDriveFileId}`;
        window.open(directDownloadUrl, '_blank');
      }
    } catch (err) {
      console.error("Download tracking failed", err);
      // Fallback: Open standard link if tracking fails
      window.open(note.websiteUrl, '_blank');
    }
  };

  // --- 4. LOGIC: SUBMIT REVIEW ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return addToast("Please login to review.", "error");
    if (userRating === 0) return addToast("Please select a star rating.", "error");

    setSubmittingReview(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/notes/${id}/review`, {
        rating: userRating,
        comment: userComment
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setReviews([res.data, ...reviews]);
      setUserComment('');
      setUserRating(0);
      addToast("Review posted!", "success");
      
      setNote(prev => ({ ...prev, reviewCount: prev.reviewCount + 1 }));
    } catch (err) {
      addToast("Failed to post review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper for Preview Window
  const getEmbedUrl = () => {
    if (note.videoUrl) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = note.videoUrl.match(regExp);
      if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
      return null;
    } 
    if (note.googleDriveFileId) {
      return `https://drive.google.com/file/d/${note.googleDriveFileId}/preview`;
    }
    return null;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">Loading...</div>;
  if (!note) return null;

  return (
    // Main background is light gray/white, text is dark gray
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      
      {/* Header: White background, light gray border */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Info Card: White background, light gray border */}
            <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center"><User className="w-4 h-4 mr-1"/> {note.uploader?.name || 'Unknown'}</span>
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {new Date(note.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center text-yellow-500"><Star className="w-4 h-4 mr-1 fill-yellow-500"/> {note.avgRating?.toFixed(1)} ({note.reviewCount})</span>
                    <span className="flex items-center text-blue-600"><Download className="w-4 h-4 mr-1"/> {note.downloads} Downloads</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {note.tags && note.tags.map(tag => (
                        // Tags: Light blue background, dark blue text, light blue border
                        <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs border border-blue-300">#{tag}</span>
                    ))}
                </div>
            </div>

            {/* Embed Viewer: White background, light gray border */}
            <div className="bg-white border border-gray-300 rounded-xl overflow-hidden aspect-video relative">
                {getEmbedUrl() ? (
                    <iframe src={getEmbedUrl()} className="w-full h-full" allowFullScreen title="Content Preview" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col text-gray-500">
                        <FileText className="w-16 h-16 mb-4" />
                        <p>Preview not available</p>
                    </div>
                )}
            </div>

            {/* --- SPLIT BUTTONS --- */}
            <div className="grid grid-cols-2 gap-4">
                {/* Preview Button (Outline): Dark text, light gray border/hover */}
                <Button onClick={handlePreview} variant="outline" className="py-6 text-lg border-gray-400 text-gray-900 hover:bg-gray-100">
                    <Eye className="w-6 h-6 mr-2" /> Preview
                </Button>

                {/* Download Button */}
                <Button onClick={handleDownload} className="py-6 text-lg bg-blue-600 hover:bg-blue-700">
                    <Download className="w-6 h-6 mr-2" /> Download
                </Button>
            </div>
        </div>

        {/* RIGHT COLUMN: REVIEWS */}
        <div className="space-y-6">
            {/* Write a Review Card: White background, light gray border */}
            <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2"/> Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= userRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                                    onClick={() => setUserRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Comment</label>
                        <textarea 
                            // Textarea: Light gray background, light gray border, dark text
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            rows="3"
                            placeholder="Was this helpful?"
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={submittingReview} className="w-full">
                        {submittingReview ? "Posting..." : "Submit Review"}
                    </Button>
                </form>
            </div>

            {/* Community Reviews Card: White background, light gray border */}
            <div className="bg-white border border-gray-300 rounded-xl p-6 max-h-[600px] overflow-y-auto shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Community Reviews ({reviews.length})</h3>
                {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No reviews yet.</p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <div key={review._id} className="border-b border-gray-200 pb-4 last:border-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex text-yellow-500 text-xs mb-2">
                                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-500"/>)}
                                </div>
                                <p className="text-sm text-gray-700">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;