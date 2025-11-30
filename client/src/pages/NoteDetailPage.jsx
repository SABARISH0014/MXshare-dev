import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Download, User, Calendar, Star, MessageSquare, 
    ArrowLeft, FileText, Eye, Lock, Loader2, Sparkles, 
    Flag, X, ShieldCheck, AlertTriangle, Ban 
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

    // Data State
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    
    // UI State
    const [showSummary, setShowSummary] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    
    // Review Form State
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Report Form State
    const [reportForm, setReportForm] = useState({ reason: "", details: "" });
    const [submittingReport, setSubmittingReport] = useState(false);
    
    const pollRef = useRef(null);

    // --- 1. FETCH DATA & POLLING ---
    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notes/${id}/reviews`);
            setReviews(res.data);
        } catch (err) {
            console.error("Failed to load reviews", err);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchNote = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/notes/${id}`);
                setNote(data);

                // Start polling if AI summary is pending or status is pending
                if (!data.aiSummary && ["approved", "pending"].includes(data.moderationStatus) && !pollRef.current) {
                    pollRef.current = setInterval(async () => {
                        console.log("🔄 Polling for Updates...");
                        try {
                            const poll = await axios.get(`${API_BASE_URL}/api/notes/${id}`);
                            // If summary appears or status changes
                            if (poll.data.aiSummary || poll.data.moderationStatus !== data.moderationStatus) {
                                setNote(poll.data);
                                if(poll.data.aiSummary) addToast("AI Summary generated!", "success");
                                clearInterval(pollRef.current);
                                pollRef.current = null;
                            }
                        } catch (err) {
                            console.error("Polling failed:", err);
                        }
                    }, 5000);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load note details.");
                addToast("Error loading note.", "error");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchNote();
        fetchReviews();

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [id]);

    // --- 2. PREVIEW LOGIC ---
    const handlePreview = () => {
        if (!user) {
            addToast("Please login to preview.", "info");
            navigate('/login', { state: { from: `/note/${id}` } });
            return;
        }
        const targetUrl = note.videoUrl || note.websiteUrl;
        if (targetUrl) window.open(targetUrl, '_blank');
        else addToast("Preview link not available.", "error");
    };

    // --- 3. DOWNLOAD LOGIC ---
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
            } else if (note.googleDriveFileId) {
                const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${note.googleDriveFileId}`;
                window.open(directDownloadUrl, '_blank');
            } else if (note.websiteUrl) {
                window.open(note.websiteUrl, '_blank');
            }
        } catch (err) {
            console.error("Download failed", err);
            // Fallback
            if(note.websiteUrl) window.open(note.websiteUrl, '_blank');
        }
    };

    // --- 4. REPORT LOGIC ---
    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            addToast("Please login to report.", "error");
            return;
        }
        
        if (!reportForm.reason || !reportForm.details) {
            addToast("Please fill in all fields.", "warning");
            return;
        }

        setSubmittingReport(true);
        try {
            await axios.post(
                `${API_BASE_URL}/api/notes/${id}/report`,
                { reason: reportForm.reason, message: reportForm.details },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            addToast("Report submitted for review.", "success");
            setShowReportModal(false);
            setReportForm({ reason: "", details: "" });
            
            // Optimistically update status to review to show badge immediately
            setNote(prev => ({ ...prev, moderationStatus: "review" }));
            
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to submit report.", "error");
        } finally {
            setSubmittingReport(false);
        }
    };

    // --- 5. REVIEW LOGIC ---
    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            addToast("Please login to review.", "error");
            navigate('/login', { state: { from: `/note/${id}` } });
            return;
        }

        if (note?.moderationStatus === "blocked") {
            addToast("Content is blocked and cannot be reviewed.", "error");
            return;
        }

        if (note?.moderationStatus === "processing") {
            addToast("Wait for safety check to complete.", "warning");
            return;
        }

        if (userRating === 0) return addToast("Please select a star rating.", "error");

        setSubmittingReview(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/notes/${id}/review`,
                { rating: userRating, comment: userComment },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            setReviews(prev => [res.data, ...prev]);
            setUserComment('');
            setUserRating(0);
            setNote((prev) => ({
                ...prev,
                reviewCount: (prev.reviewCount || 0) + 1,
                // Simple generic update for avg, real calc happens on backend
                avgRating: ((prev.avgRating * prev.reviewCount) + userRating) / (prev.reviewCount + 1)
            }));
            addToast("Review posted!", "success");
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to post review.", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    // --- HELPER: EMBED ---
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

    const handleBack = () => {
        if (location.state?.from) navigate(location.state.from);
        else if (user) navigate('/dashboard');
        else navigate('/');
    };

    // --- RENDER ---
    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Loading document details...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-900 max-w-md text-center">
                <p className="font-bold text-lg mb-2">Error Loading Page</p>
                <p className="mb-4">{error}</p>
                <Button onClick={() => navigate('/')} variant="outline">Go Back Home</Button>
            </div>
        </div>
    );

    if (!note) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white pb-20 relative transition-colors duration-300">
            
            {/* --- AI SUMMARY MODAL --- */}
            {showSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                        <button onClick={() => setShowSummary(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400 border-b pb-3 border-gray-100 dark:border-slate-800">
                            <Sparkles className="w-6 h-6" />
                            <h3 className="text-xl font-bold">AI Generated Summary</h3>
                        </div>
                        <div className="prose dark:prose-invert prose-sm max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {note.aiSummary ? (
                                <p className="whitespace-pre-wrap">{note.aiSummary}</p>
                            ) : (
                                <div className="flex flex-col items-center py-8 text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                                    <p>Generating summary...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- REPORT MODAL --- */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-red-100 dark:border-red-900/30">
                        <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400 border-b pb-3 border-gray-100 dark:border-slate-800">
                            <Flag className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Report Content</h3>
                        </div>

                        <form onSubmit={handleReportSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-red-500"
                                    value={reportForm.reason}
                                    onChange={(e) => setReportForm({...reportForm, reason: e.target.value})}
                                    required
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="spam">Spam or Misleading</option>
                                    <option value="inappropriate">Inappropriate Content</option>
                                    <option value="copyright">Copyright Violation</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Details</label>
                                <textarea 
                                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                                    placeholder="Please describe the issue..."
                                    value={reportForm.details}
                                    onChange={(e) => setReportForm({...reportForm, details: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowReportModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={submittingReport} className="bg-red-600 hover:bg-red-700 text-white">
                                    {submittingReport ? <Loader2 className="w-4 h-4 animate-spin"/> : "Submit Report"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={handleBack} className="flex items-center text-gray-600 dark:text-slate-300 hover:text-blue-600 transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Info Card */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative">
                        
                        {/* Title & Actions */}
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex-1 mr-4">
                                {note.title}
                            </h1>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowSummary(true)}
                                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition-colors"
                                    title="View AI Summary"
                                >
                                    <Sparkles className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setShowReportModal(true)}
                                    className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 transition-colors"
                                    title="Report this note"
                                >
                                    <Flag className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Moderation Banner */}
                        {note.moderationStatus === "processing" && (
                            <div className="flex items-center gap-3 rounded-lg p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0"/>
                                <span className="text-sm font-medium">AI safety review in progress. Content might be restricted temporarily.</span>
                            </div>
                        )}
                        {note.moderationStatus === "blocked" && (
                            <div className="flex items-center gap-3 rounded-lg p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                                <Ban className="w-4 h-4 shrink-0"/>
                                <span className="text-sm font-medium">Blocked: This content violates our safety policies.</span>
                            </div>
                        )}
                        {note.moderationStatus === "review" && (
                            <div className="flex items-center gap-3 rounded-lg p-3 mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200">
                                <AlertTriangle className="w-4 h-4 shrink-0"/>
                                <span className="text-sm font-medium">Under Review: Users have flagged this content.</span>
                            </div>
                        )}
                        {note.moderationStatus === "safe" && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
                                <ShieldCheck className="w-3 h-3"/> Verified Safe
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-slate-400 mb-6">
                            <span className="flex items-center bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <User className="w-3 h-3 mr-2"/> {note.uploader?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <Calendar className="w-3 h-3 mr-2"/> {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full">
                                <Star className="w-3 h-3 mr-2 fill-current"/> {note.avgRating?.toFixed(1) || 0} ({note.reviewCount || 0})
                            </span>
                            <span className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                                <Download className="w-3 h-3 mr-2"/> {note.downloads || 0}
                            </span>
                        </div>

                        {/* AI Summary Teaser */}
                        {note.aiSummary && (
                            <div 
                                onClick={() => setShowSummary(true)}
                                className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-lg cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                            >
                                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3" /> AI Summary Available
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                                    {note.aiSummary}
                                </p>
                                <span className="text-xs text-indigo-500 mt-2 block group-hover:underline">Click to read full summary</span>
                            </div>
                        )}

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
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden aspect-video relative shadow-sm">
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
                                <Button onClick={() => navigate('/login', { state: { from: `/note/${id}` } })} className="bg-blue-600 hover:bg-blue-700 text-white px-6 mt-4">Login Now</Button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handlePreview} variant="outline" className="h-14 text-base bg-white dark:bg-slate-900">
                            <Eye className="w-5 h-5 mr-2" /> Open External Link
                        </Button>
                        <Button onClick={handleDownload} className="h-14 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">
                            <Download className="w-5 h-5 mr-2" /> Download Material
                        </Button>
                    </div>
                </div>

                {/* RIGHT COLUMN: REVIEWS */}
                <div className="space-y-6">
                    {/* Write Review */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-blue-500"/> Write a Review
                        </h3>
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
                                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    rows="3"
                                    placeholder={user ? "How was this material?" : "Please login to comment..."}
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    disabled={!user}
                                />
                            </div>
                            <Button type="submit" disabled={submittingReview || !user} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl">
                                {submittingReview ? <Loader2 className="animate-spin w-4 h-4"/> : "Submit Review"}
                            </Button>
                        </form>
                    </div>

                    {/* Community Reviews */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-h-[600px] overflow-y-auto shadow-sm custom-scrollbar">
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