import React, { useState, useContext } from 'react';
import { Trash2, FileText, Calendar, User, Eye, Download, LogOut, Lock, Users, FileCheck, ArrowDownCircle } from 'lucide-react';
import { Button } from '../components/ui/primitives';
import { ToastContext } from '../context/ToastContext';

// Static Data (Perfect for now — change to API later)
const STATS = {
  totalUsers: 842,
  totalNotes: 127,
  totalDownloads: 5847,
  pendingNotes: 12
};

const STATIC_NOTES = [
  { _id: "1", title: "Data Structures Full Notes", subject: "DSA", uploader: { name: "Rahul" }, createdAt: "2025-04-10", downloads: 245 },
  { _id: "2", title: "Operating Systems Handwritten", subject: "OS", uploader: { name: "Priya" }, createdAt: "2025-04-08", downloads: 189 },
  { _id: "3", title: "DBMS Complete Material", subject: "DBMS", uploader: { name: "Anjali" }, createdAt: "2025-04-05", downloads: 312 },
  { _id: "4", title: "Computer Networks Notes", subject: "CN", uploader: { name: "Vikram" }, createdAt: "2025-04-03", downloads: 167 },
  { _id: "5", title: "Machine Learning Basics", subject: "ML", uploader: { name: "Sneha" }, createdAt: "2025-04-01", downloads: 428 }
];

// Login Form (Same clean one)
const AdminAuthForm = ({ onAdminLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { addToast } = useContext(ToastContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email !== "admin@psgtech.ac.in" || formData.password !== "admin123") {
      setError('Invalid credentials');
      return;
    }
    addToast('Welcome back, Admin!', 'success');
    onAdminLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-black mb-8">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-center">{error}</div>}
          <input type="email" placeholder="admin@psgtech.ac.in" value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-indigo-500 focus:outline-none" required />
          <input type="password" placeholder="Password" value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-indigo-500 focus:outline-none" required />
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" /> Login
          </Button>
        </form>
      </div>
    </div>
  );
};

// Main Admin Dashboard with Top Stats + Notes List
const AdminDashboard = ({ onLogout }) => {
  const [notes] = useState(STATIC_NOTES);
  const { addToast } = useContext(ToastContext);

  const deleteNote = (id) => {
    if (window.confirm("Delete this note permanently?")) {
      addToast("Note deleted", "success");
      // In future: remove from state or API call
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">MXShare Admin Dashboard</h1>
          <button onClick={onLogout} className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </header>

      {/* Top Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl p-6 shadow-lg">
            <Users className="w-10 h-10 mb-3" />
            <p className="text-3xl font-bold">{STATS.totalUsers}</p>
            <p className="text-blue-100">Total Users</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
            <FileText className="w-10 h-10 mb-3" />
            <p className="text-3xl font-bold">{STATS.totalNotes}</p>
            <p className="text-purple-100">Total Notes</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-lg">
            <ArrowDownCircle className="w-10 h-10 mb-3" />
            <p className="text-3xl font-bold">{STATS.totalDownloads}</p>
            <p className="text-green-100">Total Downloads</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 shadow-lg">
            <FileCheck className="w-10 h-10 mb-3" />
            <p className="text-3xl font-bold">{STATS.pendingNotes}</p>
            <p className="text-orange-100">Pending Approval</p>
          </div>
        </div>

        {/* All Notes Section */}
        <h2 className="text-2xl font-bold text-black mb-6">All Uploaded Notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note._id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-black line-clamp-2">{note.title}</h3>
                  <button onClick={() => deleteNote(note._id)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition hover:scale-110">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" /> {note.uploader.name}</p>
                  <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" /> {note.subject}</p>
                  <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" /> {note.createdAt}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Eye className="w-4 h-4" /> {note.downloads}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600 font-medium">
                    <Download className="w-4 h-4" /> {note.downloads}
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

// Main Admin Page
const AdminPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <AdminDashboard onLogout={() => setIsLoggedIn(false)} />
  ) : (
    <AdminAuthForm onAdminLogin={() => setIsLoggedIn(true)} />
  );
};

export default AdminPage;