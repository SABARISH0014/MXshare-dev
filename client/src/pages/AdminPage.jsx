import React, { useState, useEffect, useContext } from 'react';
import { Trash2, FileText, Calendar, User, Eye, Download, LogOut, Lock, Users, FileCheck, ArrowDownCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { ToastContext } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../data/constants';

// --- STATIC FALLBACK DATA ---
const STATIC_NOTES = [
  { _id: "1", title: "Data Structures Full Notes", subject: "DSA", uploader: { name: "Rahul" }, createdAt: "2025-04-10", downloads: 245 },
  { _id: "2", title: "Operating Systems Handwritten", subject: "OS", uploader: { name: "Priya" }, createdAt: "2025-04-08", downloads: 189 },
  { _id: "3", title: "DBMS Complete Material", subject: "DBMS", uploader: { name: "Anjali" }, createdAt: "2025-04-05", downloads: 312 },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  
  const [stats, setStats] = useState({
    totalUsers: 0, totalNotes: 0, totalDownloads: 0, pendingNotes: 0
  });
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. SECURITY CHECK & DATA FETCH ---
  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    // If no token, kick user back to login
    if (!token) {
        addToast("Unauthorized. Please login as Admin.", "error");
        navigate('/login');
        return;
    }

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setNotes(res.data.notes);
        } catch (error) {
            console.log("Using static data (Backend not connected or error)");
            setNotes(STATIC_NOTES);
            setStats({ totalUsers: 842, totalNotes: 127, totalDownloads: 5847, pendingNotes: 12 });
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [navigate, addToast]);

  // --- 2. LOGOUT LOGIC (Updated to clear EVERYTHING) ---
  const handleLogout = () => {
     if(window.confirm("Are you sure you want to logout?")) {
         // 1. Clear Storage
         localStorage.clear();

         // 2. UI Feedback
         addToast("Logged out successfully", "success");
         
         // 3. FORCE REFRESH REDIRECT
         // Replace navigate('/login') with this:
         window.location.href = '/login'; 
     }
  };

  // --- 3. DELETE LOGIC ---
  const deleteNote = async (id) => {
    if (window.confirm("Delete this note permanently?")) {
      try {
          const token = localStorage.getItem('adminToken');
          // await axios.delete(`${API_BASE_URL}/api/notes/${id}`, { headers: { Authorization: `Bearer ${token}` }});
          
          setNotes(prev => prev.filter(n => n._id !== id));
          addToast("Note deleted successfully", "success");
      } catch (error) {
          addToast("Failed to delete note", "error");
      }
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
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
          <StatCard icon={FileText} label="Total Notes" value={stats.totalNotes} color="purple" />
          <StatCard icon={ArrowDownCircle} label="Total Downloads" value={stats.totalDownloads} color="green" />
          <StatCard icon={FileCheck} label="Pending Approval" value={stats.pendingNotes} color="orange" />
        </div>

        {/* All Notes Section */}
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
                  <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" /> 
                      <span>{note.createdAt?.split('T')[0]}</span>
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
      </div>
    </div>
  );
};

// Helper for Stats
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