import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Download, User, Calendar, Star, MessageSquare, 
    ArrowLeft, FileText, Eye, Lock, Loader2, Sparkles // Added Sparkles
} from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import { Button } from '../components/ui/primitives'; 
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { API_BASE_URL } from '../data/constants';

const NoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 

  const { user, authToken } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Review State
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        setLoading(true);
        const noteRes = await axios.get(`${API_BASE_URL}/api/notes/${id}`);
        setNote(noteRes.data);
        
        try {
            const reviewRes = await axios.get(`${API_BASE_URL}/api/notes/${id}/reviews`);
            setReviews(reviewRes.data);
        } catch (reviewErr) {
            console.warn("Could not load reviews", reviewErr);
        }

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load note details.");
        addToast("Error loading note.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchData();
    } else {
        setError("Invalid Note ID");
        setLoading(false);
    }
  }, [id, addToast]); 

  // --- 2. LOGIC: PREVIEW ---
  const handlePreview = () => {
    if (!user) {
        addToast("Please login to preview this document.", "info");
        navigate('/login', { state: { from: `/note/${id}` } });
        return;
    }

    const targetUrl = note.videoUrl || note.websiteUrl;
    
    if (targetUrl) {
        window.open(targetUrl, '_blank');
    } else {
        addToast("Preview link not available.", "error");
    }
  };

  // --- 3. LOGIC: DOWNLOAD ---
  const handleDownload = async () => {
    if (!user) {
        addToast("Please login to download.", "info");
        navigate('/login', { state: { from: `/note/${id}` } });
        return;
    }

    try {
      if (authToken) {
          await axios.post(
            `${API_BASE_URL}/api/notes/${id}/download`, 
            {}, 
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
      }
      
      setNote(prev => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
      addToast("Starting download...", "success");
      
      if (note.videoUrl) {
        window.open(note.videoUrl, '_blank');
      } 
      else if (note.googleDriveFileId) {
        const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${note.googleDriveFileId}`;
        window.open(directDownloadUrl, '_blank');
      } else if (note.websiteUrl) {
        window.open(note.websiteUrl, '_blank');
      }
    } catch (err) {
      console.error("Download tracking failed", err);
      if(note.websiteUrl) window.open(note.websiteUrl, '_blank');
    }
  };

  // --- 4. LOGIC: SUBMIT REVIEW ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        addToast("Please login to review.", "error");
        navigate('/login', { state: { from: `/note/${id}` } });
        return;
    }
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
      
      setNote(prev => ({ 
          ...prev, 
          reviewCount: (prev.reviewCount || 0) + 1 
      }));
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to post review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getEmbedUrl = () => {
    if (!note) return null;
    
    if (note.videoUrl) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = note.videoUrl.match(regExp);
      if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
    } 
    if (note.googleDriveFileId) {
      return `https://drive.google.com/file/d/${note.googleDriveFileId}/preview`;
    }
    return null;
  };

  // --- 5. LOGIC: SMART NAVIGATION (Fix for Login Loop) ---
  const handleBack = () => {
    // A. If we came from a specific place (like a search result), go back there
    if (location.state?.from) {
        navigate(location.state.from);
        return;
    }

    // B. If user is logged in, ALWAYS go to Dashboard (never back to Login page)
    if (user) {
        navigate('/dashboard');
    } 
    // C. If guest, go to Home Page
    else {
        navigate('/');
    }
  };

  // --- RENDER STATES ---

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center text-gray-900 dark:text-white transition-colors duration-300">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <p className="text-gray-500 dark:text-slate-400">Loading document details...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center text-gray-900 dark:text-white p-4 transition-colors duration-300">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-900 max-w-md text-center">
            <p className="font-bold text-lg mb-2">Error Loading Page</p>
            <p className="mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700">Go Back Home</Button>
        </div>
    </div>
  );

  if (!note) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white pb-20 transition-colors duration-300">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 sticky top-0 z-30 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button 
                onClick={handleBack} 
                className="flex items-center text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
            <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Info Card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">{note.title}</h1>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-400 mb-4">
                    <span className="flex items-center bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full"><User className="w-4 h-4 mr-2 text-gray-500 dark:text-slate-500"/> {note.uploader?.name || 'Unknown'}</span>
                    <span className="flex items-center bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full"><Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-slate-500"/> {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}</span>
                    <span className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30 px-3 py-1 rounded-full"><Star className="w-4 h-4 mr-2 fill-yellow-500 text-yellow-500"/> {note.avgRating?.toFixed(1) || 0} ({note.reviewCount || 0})</span>
                    <span className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30 px-3 py-1 rounded-full"><Download className="w-4 h-4 mr-2"/> {note.downloads || 0}</span>
                </div>

                {/* --- AI SUMMARY SECTION --- */}
                {note.aiSummary && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4" /> AI Generated Summary
                    </h3>
                    <p className="text-gray-700 dark:text-indigo-100 leading-relaxed text-sm">
                      {note.aiSummary}
                    </p>
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
                  {note.description || "No manual description provided."}
                </p>

                <div className="flex flex-wrap gap-2">
                    {note.tags && note.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">#{tag}</span>
                    ))}
                </div>
            </div>

            {/* Embed Viewer */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden aspect-video relative shadow-sm transition-colors duration-300">
                {user ? (
                    getEmbedUrl() ? (
                        <iframe src={getEmbedUrl()} className="w-full h-full" allowFullScreen title="Content Preview" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950">
                            <FileText className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-600" />
                            <p>Preview not available for this file type.</p>
                            <p className="text-sm mt-2">Please use the download button.</p>
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm mb-4">
                            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-bold text-lg">Login to preview this document</p>
                        <p className="text-sm text-gray-500 dark:text-slate-500 mb-4">Access is restricted to registered members</p>
                        <Button onClick={() => navigate('/login', { state: { from: `/note/${id}` } })} className="bg-blue-600 hover:bg-blue-700 text-white px-6">Login Now</Button>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handlePreview} variant="outline" className="h-14 text-base border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-600">
                    <Eye className="w-5 h-5 mr-2" /> Open External Link
                </Button>

                <Button onClick={handleDownload} className="h-14 text-base bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30">
                    <Download className="w-5 h-5 mr-2" /> Download Material
                </Button>
            </div>
        </div>

        {/* RIGHT COLUMN: REVIEWS */}
        <div className="space-y-6">
            {/* Write Review */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-500"/> Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-500 mb-2">Your Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    className={`w-8 h-8 cursor-pointer transition-transform hover:scale-110 ${star <= userRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-slate-700 fill-gray-100 dark:fill-slate-800'}`}
                                    onClick={() => setUserRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-500 mb-2">Your Comment</label>
                        <textarea 
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-slate-600"
                            rows="3"
                            placeholder={user ? "How was this material?" : "Please login to comment..."}
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            disabled={!user}
                        />
                    </div>
                    <Button type="submit" disabled={submittingReview || !user} className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl">
                        {submittingReview ? <Loader2 className="animate-spin w-4 h-4"/> : "Submit Review"}
                    </Button>
                </form>
            </div>

            {/* Community Reviews */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-h-[600px] overflow-y-auto shadow-sm custom-scrollbar transition-colors duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reviews ({reviews.length})</h3>
                {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-950 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                        <p className="text-sm">No reviews yet. Be the first!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <div key={review._id} className="border-b border-gray-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs mr-3">
                                            {review.user?.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{review.user?.name || 'Anonymous'}</p>
                                            <div className="flex text-yellow-400 text-[10px]">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400' : 'text-gray-200 dark:text-slate-700 fill-gray-200 dark:fill-slate-800'}`}/>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-300 pl-11">{review.comment}</p>
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