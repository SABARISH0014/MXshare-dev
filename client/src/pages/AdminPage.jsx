import React, { useState, useEffect, useContext } from 'react';
import { 
  Trash2, FileText, Calendar, User, Eye, Download, LogOut, 
  Lock, Users, FileCheck, ArrowDownCircle, Loader2, 
  ShieldAlert, CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { ToastContext } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../data/constants';

// --- STATIC FALLBACK DATA ---
const STATIC_NOTES = [
  { _id: "1", title: "Data Structures Full Notes", subject: "DSA", uploader: { name: "Rahul" }, createdAt: "2025-04-10", downloads: 245, moderationStatus: "safe" },
  { _id: "2", title: "Operating Systems Handwritten", subject: "OS", uploader: { name: "Priya" }, createdAt: "2025-04-08", downloads: 189, moderationStatus: "safe" },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'moderation'
  const [stats, setStats] = useState({ totalUsers: 0, totalNotes: 0, totalDownloads: 0, pendingNotes: 0 });
  const [notes, setNotes] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]); // NEW: For flagged items
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. INITIAL FETCH (Overview Data) ---
  useEffect(() => {
    // Try 'adminToken' first, if missing, try 'authToken' (Google Login usually sets this)
const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('token');
    if (!token) {
        addToast("Unauthorized. Please login as Admin.", "error");
        navigate('/login');
        return;
    }

    const fetchOverviewData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setNotes(res.data.notes);
        } catch (error) {
            console.log("Using static data");
            setNotes(STATIC_NOTES);
            setStats({ totalUsers: 842, totalNotes: 127, totalDownloads: 5847, pendingNotes: 12 });
        } finally {
            setIsLoading(false);
        }
    };

    fetchOverviewData();
  }, [navigate, addToast]);

  // --- 2. FETCH MODERATION QUEUE (When Tab Changes) ---
  useEffect(() => {
    if (activeTab === 'moderation') {
        const fetchQueue = async () => {
            try {
                // Try 'adminToken' first, if missing, try 'authToken' (Google Login usually sets this)
const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/queue`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setModerationQueue(res.data);
            } catch (error) {
                console.error("Failed to fetch queue", error);
                addToast("Could not load moderation queue", "error");
            }
        };
        fetchQueue();
    }
  }, [activeTab, addToast]);

  // --- 3. ACTIONS ---
  const handleLogout = () => {
     if(window.confirm("Are you sure you want to logout?")) {
         localStorage.clear();
         addToast("Logged out successfully", "success");
         window.location.href = '/login'; 
     }
  };

  const deleteNote = async (id) => {
    if (window.confirm("Delete this note permanently?")) {
      try {
          const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('token');
          await axios.delete(`${API_BASE_URL}/api/notes/${id}`, { headers: { Authorization: `Bearer ${token}` }});
          setNotes(prev => prev.filter(n => n._id !== id));
          addToast("Note deleted successfully", "success");
      } catch (error) {
          addToast("Failed to delete note", "error");
      }
    }
  };

  // --- 4. NEW: AI REVIEW ACTIONS ---
  const handleReviewDecision = async (noteId, decision, comment) => {
    try {
        const token = localStorage.getItem('adminToken');
        await axios.post(`${API_BASE_URL}/api/admin/review/${noteId}`, 
            { decision, adminComment: comment },
            { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Remove from queue locally
        setModerationQueue(prev => prev.filter(n => n._id !== noteId));
        addToast(`Note marked as ${decision === 'approve' ? 'Safe' : 'Blocked'}`, "success");
        
        // Refresh stats
        setStats(prev => ({ 
            ...prev, 
            pendingNotes: Math.max(0, prev.pendingNotes - 1) 
        }));
    } catch (error) {
        addToast("Action failed", "error");
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
               <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <div className="text-indigo-600 font-bold animate-pulse">Loading Admin Dashboard...</div>
               </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <button onClick={handleLogout} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <LogOut className="w-4 h-4" /> Logout
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB NAVIGATION */}
        <div className="flex space-x-4 mb-8 border-b dark:border-slate-800">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                    activeTab === 'overview' 
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >
                Overview & Stats
            </button>
            <button 
                onClick={() => setActiveTab('moderation')}
                className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 relative ${
                    activeTab === 'moderation' 
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >
                AI Moderation Queue
                {stats.pendingNotes > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                        {stats.pendingNotes}
                    </span>
                )}
            </button>
        </div>

        {/* TAB 1: OVERVIEW (Your Original View) */}
        {activeTab === 'overview' && (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
                  <StatCard icon={FileText} label="Total Notes" value={stats.totalNotes} color="purple" />
                  <StatCard icon={ArrowDownCircle} label="Total Downloads" value={stats.totalDownloads} color="green" />
                  <StatCard icon={FileCheck} label="Pending Approval" value={stats.pendingNotes} color="orange" />
                </div>

                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Uploaded Notes</h2>
                     <span className="text-sm text-gray-500 dark:text-gray-400">{notes.length} files found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <div key={note._id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-lg transition duration-200">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">{note.title}</h3>
                          <button onClick={() => deleteNote(note._id)}
                            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-indigo-500" /> 
                              <span className="font-medium text-gray-900 dark:text-gray-300">{note.uploader?.name || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-purple-500" /> 
                              <span>{note.subject}</span>
                          </div>
                          {/* Mod Status Badge */}
                          <div className="flex items-center gap-2">
                                <ShieldAlert className={`w-4 h-4 ${note.moderationStatus === 'blocked' ? 'text-red-500' : 'text-green-500'}`} />
                                <span className="capitalize">{note.moderationStatus || 'Safe'}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-sm">
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <Eye className="w-4 h-4" /> {note.downloads || 0} Views
                          </span>
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                            <Download className="w-4 h-4" /> {note.downloads || 0} DLs
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </>
        )}

        {/* TAB 2: AI MODERATION QUEUE */}
        {activeTab === 'moderation' && (
            <div className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <div>
                        <h3 className="font-bold text-orange-800 dark:text-orange-200">AI Review Required</h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                            These files were flagged by the AI for potential violations (Hate speech, Violence, NSFW, etc.).
                            Please review the scores and override if safe.
                        </p>
                    </div>
                </div>

                {moderationQueue.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Clear!</h3>
                        <p className="text-gray-500">No content currently requires moderation.</p>
                    </div>
                ) : (
                    moderationQueue.map((item) => (
                        <div key={item._id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                            {/* Left: Preview */}
                            <div className="md:w-1/4 bg-gray-100 dark:bg-slate-800 p-6 flex flex-col items-center justify-center text-center">
                                {item.thumbnailUrl ? (
                                    <img src={item.thumbnailUrl} alt="Preview" className="h-32 object-cover rounded shadow mb-4" />
                                ) : (
                                    <div className="h-32 w-full bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center mb-4">No Preview</div>
                                )}
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                                <a href={item.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> View Original File
                                </a>
                            </div>

                            {/* Middle: AI Scores */}
                            <div className="md:w-2/4 p-6 border-r border-gray-100 dark:border-slate-800">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    🤖 AI Analysis Report
                                    <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${item.moderationStatus === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {item.moderationStatus}
                                    </span>
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    {item.moderationLog?.categories && Object.entries(item.moderationLog.categories).map(([key, data]) => (
                                        <div key={key} className="flex justify-between pr-4">
                                            <span className="text-gray-500 capitalize">{key.replace('_', ' ')}</span>
                                            <span className={`font-mono font-bold ${data.score > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                                {data.score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {item.aiSummary && (
                                    <div className="mt-4 bg-gray-50 dark:bg-slate-800 p-3 rounded text-sm text-gray-600 dark:text-gray-400 italic">
                                        "{item.aiSummary}"
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="md:w-1/4 p-6 flex flex-col justify-center gap-3 bg-gray-50 dark:bg-slate-800/50">
                                <button 
                                    onClick={() => handleReviewDecision(item._id, 'approve', 'Manually Approved by Admin')}
                                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark Safe
                                </button>
                                <button 
                                    onClick={() => handleReviewDecision(item._id, 'block', 'Confirmed Violation')}
                                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <XCircle className="w-4 h-4" /> Block Content
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

      </div>
    </div>
  );
};

// Helper for Stats (Unchanged)
const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        blue: "from-blue-500 to-cyan-500",
        purple: "from-purple-500 to-pink-500",
        green: "from-emerald-500 to-teal-500",
        orange: "from-orange-500 to-red-500"
    };

    return (
        <div className={`bg-gradient-to-r ${colors[color]} text-white rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                <Icon className="w-24 h-24" />
            </div>
            <Icon className="w-8 h-8 mb-3 relative z-10" />
            <p className="text-3xl font-bold relative z-10">{value}</p>
            <p className="text-white/80 font-medium relative z-10">{label}</p>
        </div>
    );
}

export default AdminPage;