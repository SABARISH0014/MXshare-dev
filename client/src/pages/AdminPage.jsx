import React, { useState, useEffect, useContext } from 'react';
import { 
  Trash2, FileText, Calendar, User, Eye, Download, LogOut, 
  Lock, Users, FileCheck, ArrowDownCircle, Loader2, 
  ShieldAlert, CheckCircle, XCircle, AlertTriangle, Flag, LayoutDashboard 
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../data/constants';

const AdminPage = () => {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'moderation' | 'reports'
  const [stats, setStats] = useState({
    totalUsers: 0, totalNotes: 0, totalDownloads: 0, pendingNotes: 0
  });
  
  // Data Buckets
  const [notes, setNotes] = useState([]); // For Overview
  const [moderationQueue, setModerationQueue] = useState([]); // For AI Tab
  const [reportsQueue, setReportsQueue] = useState([]); // For Reports Tab
  
  const [isLoading, setIsLoading] = useState(true);

  // --- HELPER: GET TOKEN ---
  const getToken = () => 
    localStorage.getItem('adminToken') || 
    localStorage.getItem('authToken') || 
    localStorage.getItem('token');

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  // --- 1. INITIAL FETCH (Stats & Overview) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!getToken()) {
        addToast("Unauthorized. Please login.", "error");
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-data`, getHeaders());
        setStats(res.data.stats);
        setNotes(res.data.notes);
      } catch (error) {
        console.warn("Dashboard fetch failed:", error.message);
        // Optional: Set static data here if needed for demo
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, addToast]);

  // --- 2. FETCH SPECIFIC QUEUES ON TAB CHANGE ---
  useEffect(() => {
    if (activeTab === "moderation") fetchModerationQueue();
    if (activeTab === "reports") fetchReportsQueue();
  }, [activeTab]);

  const fetchModerationQueue = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/queue`, getHeaders());
      setModerationQueue(res.data || []);
    } catch (err) {
      addToast("Failed to load moderation queue", "error");
    }
  };

  // 🚩 LOGIC FIX: Flatten Reports for UI
  const fetchReportsQueue = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports`, getHeaders());
      const formattedReports = res.data.map(report => ({
        _id: report.note._id, // NOTE ID (for display/linking)
        reportId: report._id, // REPORT ID (for API actions)
        title: report.note.title,
        moderationStatus: report.note.moderationStatus,
        uploader: report.note.uploader, // Keep uploader info if available
        createdAt: report.createdAt,
        isReport: true, 
        reason: report.reason,
        reportedBy: report.user.name,
        message: report.message
      }));
      setReportsQueue(formattedReports);
    } catch (err) {
      addToast("Failed to load reports", "error");
    }
  };

  // --- 3. HANDLE DECISIONS (LOGIC FIX APPLIED) ---
  const handleDecision = async (item, decision, comment = "") => {
    try {
      // CASE A: User Report
      if (item.isReport) {
        const endpoint = decision === 'block' 
          ? `${API_BASE_URL}/api/admin/reports/${item.reportId}/block-note`
          : `${API_BASE_URL}/api/admin/reports/${item.reportId}/resolve`;

        await axios.post(endpoint, { adminComment: comment }, getHeaders());
        
        // Update UI
        setReportsQueue(prev => prev.filter(n => n.reportId !== item.reportId));
        addToast(decision === 'block' ? "Content Blocked" : "Report Resolved", "success");
      } 
      // CASE B: AI Moderation
      else {
        await axios.post(
          `${API_BASE_URL}/api/admin/review/${item._id}`, 
          { decision, adminComment: comment }, 
          getHeaders()
        );
        
        // Update UI
        setModerationQueue(prev => prev.filter(n => n._id !== item._id));
        addToast(`Note marked as ${decision}`, "success");
      }
    } catch (error) {
      console.error(error);
      addToast("Action failed", "error");
    }
  };

  const handleLogout = () => {
    if(window.confirm("Logout of Admin Dashboard?")) {
      localStorage.clear();
      window.location.href = '/login'; 
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <div className="text-indigo-600 font-bold animate-pulse">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 sticky top-0 z-20">
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

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
          <StatCard icon={FileText} label="Total Notes" value={stats.totalNotes} color="purple" />
          <StatCard icon={ArrowDownCircle} label="Downloads" value={stats.totalDownloads} color="green" />
          <StatCard icon={FileCheck} label="Pending Review" value={stats.pendingNotes} color="orange" />
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 mb-8">
          {[
            { id: 'overview', label: 'All Notes', icon: LayoutDashboard },
            { id: 'moderation', label: 'AI Moderation Queue', icon: ShieldAlert },
            { id: 'reports', label: 'User Reports', icon: Flag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 flex items-center gap-2 font-medium transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT: OVERVIEW (ALL NOTES) --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Uploads</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{notes.length} notes</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <NoteCardUI key={note._id} note={note} showDelete={true} />
              ))}
              {notes.length === 0 && <p className="text-gray-500">No notes found.</p>}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: MODERATION & REPORTS (Using Shared Logic) --- */}
        {(activeTab === 'moderation' || activeTab === 'reports') && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'moderation' ? "AI Flagged Content" : "User Reported Content"}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'moderation' ? moderationQueue.length : reportsQueue.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'moderation' ? moderationQueue : reportsQueue).map((item) => (
                <ModerationCardUI 
                  key={item._id || item.reportId} 
                  item={item} 
                  onDecision={handleDecision} 
                />
              ))}
              
              {((activeTab === 'moderation' && moderationQueue.length === 0) || 
                (activeTab === 'reports' && reportsQueue.length === 0)) && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed dark:border-slate-800">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                  <p className="text-lg text-gray-500">All clear! No items pending review.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

// 1. Standard Note Card (For Overview)
const NoteCardUI = ({ note, showDelete }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-lg transition duration-200 group">
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">{note.title}</h3>
        {showDelete && (
          <button className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition opacity-0 group-hover:opacity-100">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" /> 
          <span className="font-medium text-gray-900 dark:text-gray-300">{note.uploader?.name || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-500" /> 
          <span>{note.subject || "General"}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-sm">
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
          <Eye className="w-4 h-4" /> {note.downloads || 0}
        </span>
        <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs uppercase font-bold">
          {note.moderationStatus || 'safe'}
        </span>
      </div>
    </div>
  </div>
);

// 2. Moderation/Report Card (Actionable)
const ModerationCardUI = ({ item, onDecision }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border-l-4 border-l-orange-500 border-y border-r border-gray-200 dark:border-slate-800 dark:border-l-orange-500 overflow-hidden">
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        {item.isReport ? (
           <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
             <Flag className="w-3 h-3" /> REPORTED
           </span>
        ) : (
           <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
             <ShieldAlert className="w-3 h-3" /> AI FLAGGED
           </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-2">{item.title}</h3>
      
      {/* Report Specific Details */}
      {item.isReport && (
        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg mb-4 text-sm">
          <p className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3"/> Reason: {item.reason}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-1 italic">"{item.message || 'No details provided'}"</p>
          <p className="text-xs text-gray-500 mt-2 text-right">- by {item.reportedBy}</p>
        </div>
      )}

      {/* AI Specific Details */}
      {!item.isReport && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          AI detected potential policy violation. Please review manually.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button 
          onClick={() => onDecision(item, "approve")}
          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 font-medium transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {item.isReport ? "Dismiss" : "Safe"}
        </button>
        <button 
          onClick={() => onDecision(item, "block")}
          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-medium transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Block
        </button>
      </div>
    </div>
  </div>
);

// 3. Stat Card (From your request)
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
};

export default AdminPage;