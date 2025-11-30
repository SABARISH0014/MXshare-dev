import React, { useState, useEffect, useContext } from 'react';
import {
  Trash2, FileText, Calendar, User, Eye, Download, LogOut,
  Lock, Users, FileCheck, ArrowDownCircle, Loader2,
  ShieldAlert, CheckCircle, XCircle, AlertTriangle, Flag
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../data/constants';

// Static fallback data for UI
const STATIC_NOTES = [
  { _id: "1", title: "Sample Note", subject: "Unknown", downloads: 120, moderationStatus: "safe" }
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalDownloads: 0,
    pendingNotes: 0,
  });

  const [notes, setNotes] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [reportsQueue, setReportsQueue] = useState([]);

  const [loading, setLoading] = useState(true);

  const getToken = () =>
    localStorage.getItem("adminToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token");

  const headers = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // === Fetch Overview Data ===
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-data`, {
          headers: headers(),
        });

        setStats(res.data.stats);
        setNotes(res.data.notes);
      } catch (err) {
        console.warn("Fallback UI due to API error:", err.message);
        setNotes(STATIC_NOTES);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // === Fetch Mod Queue ===
  useEffect(() => {
    if (activeTab === "moderation") fetchModerationQueue();
    if (activeTab === "reports") fetchReportsQueue();
  }, [activeTab]);

  const fetchModerationQueue = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/queue`, { headers: headers() });
      setModerationQueue(res.data || []);
    } catch (err) {
      addToast("Failed to load moderation queue", "error");
    }
  };

  const fetchReportsQueue = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports`, { headers: headers() });
      setReportsQueue(res.data || []);
    } catch (err) {
      addToast("Failed to load reported notes", "error");
    }
  };

  // === Handle Moderation Decision ===
  const handleDecision = async (noteId, decision, comment = "") => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/review/${noteId}`,
        { decision, adminComment: comment },
        { headers: headers() }
      );

      setModerationQueue(prev => prev.filter(n => n._id !== noteId));
      setReportsQueue(prev => prev.filter(n => n._id !== noteId));

      addToast(`Note marked as: ${decision.toUpperCase()}`, "success");
    } catch {
      addToast("Moderation action failed", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b p-4 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <Lock className="text-blue-600 w-6 h-6" />
            <h1 className="font-bold text-lg">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center text-red-600 gap-2 hover:underline"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-4 border-b">
        {[
          { id: "overview", label: "Overview & Stats" },
          { id: "moderation", label: "AI Moderation Queue" },
          { id: "reports", label: "User Reports", icon: Flag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-medium ${
              activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.icon && <tab.icon className="inline w-4 h-4 mr-1" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT SECTIONS */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === "overview" && (
          <>
            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard icon={Users} label="Users" value={stats.totalUsers} color="blue" />
              <StatCard icon={FileText} label="Notes" value={stats.totalNotes} color="purple" />
              <StatCard icon={ArrowDownCircle} label="Downloads" value={stats.totalDownloads} color="green" />
              <StatCard
                icon={FileCheck}
                label="Pending"
                value={stats.pendingNotes}
                color="orange"
              />
            </div>

            <h2 className="font-bold text-xl mb-4">Recent Notes</h2>
            {notes.length === 0 ? (
              <p>No notes found.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((n) => (
                  <div key={n._id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow">
                    <h3 className="font-bold line-clamp-2">{n.title}</h3>
                    <p className="text-xs mt-2 text-gray-500">Downloads: {n.downloads}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "moderation" && (
          <ModerationList queue={moderationQueue} handleDecision={handleDecision} />
        )}

        {activeTab === "reports" && (
          <ModerationList queue={reportsQueue} handleDecision={handleDecision} isReports />
        )}
      </div>
    </div>
  );
};

// REUSABLE COMPONENT (Moderation UI)
const ModerationList = ({ queue, handleDecision, isReports = false }) => (
  <>
    {queue.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <p>{isReports ? "No reported notes 🎉" : "No AI flagged notes 🎉"}</p>
      </div>
    ) : (
      queue.map((item) => (
        <div
          key={item._id}
          className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-5 mb-5"
        >
          <h3 className="font-semibold text-lg">{item.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Status: <b className="uppercase">{item.moderationStatus}</b>
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleDecision(item._id, "approve")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <CheckCircle size={16} /> Mark Safe
            </button>
            <button
              onClick={() => handleDecision(item._id, "block")}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <XCircle size={16} /> Block
            </button>
          </div>
        </div>
      ))
    )}
  </>
);

// Stats card UI
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    green: "bg-emerald-600",
    orange: "bg-orange-600",
  };

  return (
    <div className={`${colors[color]} text-white p-6 rounded-2xl shadow-lg`}>
      <Icon className="w-7 h-7 mb-2" />
      <p className="text-3xl font-black">{value}</p>
      <p className="text-white/80 text-sm">{label}</p>
    </div>
  );
};

export default AdminPage;
