import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Aperture, LogOut, User, Lock, Upload, BookOpen, 
    Award, Hash, Calendar, Zap, FileText, Menu, 
    ExternalLink, Eye, Loader2, Edit2, Save, X, Heart, Target 
} from 'lucide-react';

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components/ui/primitives';
import { API_BASE_URL } from '../data/constants';
import { AuthContext } from '../context/AuthContext';
import FileUploadCard from '../components/FileUploadCard';
import TopContributors from '../components/TopContributors';

const LucideIcons = { Aperture, User, Lock, Upload, BookOpen, Award, LogOut };

// ----------------------------------------------------------------------
// 1. CONTRIBUTIONS COMPONENT (Displays MongoDB Data)
// ----------------------------------------------------------------------
const DashboardContributions = ({ user, onNoteView }) => {
    const [myNotes, setMyNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyNotes = async () => {
            try {
                // Fetch ALL notes from MongoDB
                const res = await axios.get(`${API_BASE_URL}/api/notes`);
                
                // Filter for notes where uploader ID matches current User ID
                if (res.data && user) {
                    const userNotes = res.data.filter(note => 
                        note.uploader && note.uploader._id === user._id
                    );
                    setMyNotes(userNotes);
                }
            } catch (error) {
                console.error("Failed to fetch contributions:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchMyNotes();
    }, [user]);

    if (loading) return <div className="text-white flex items-center p-6"><Loader2 className="animate-spin mr-2"/> Loading your contributions...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">My Contributions ({myNotes.length})</h2>
            <p className="text-gray-300">A record of materials you have uploaded to the Robot Drive.</p>
            
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                {myNotes.length > 0 ? (
                    myNotes.map((note) => (
                        <div key={note._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg shadow-sm border border-gray-800 hover:border-gray-600 transition-colors">
                            
                            {/* Left: Icon & Text */}
                            <div className="flex items-center space-x-4 min-w-0 overflow-hidden">
                                <div className="p-2 bg-blue-900/30 rounded-lg">
                                    {note.videoUrl ? (
                                        <ExternalLink className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-white truncate">{note.title}</p>
                                    <div className="flex items-center text-xs text-gray-400 space-x-3">
                                        <span>{note.subject}</span>
                                        <span>•</span>
                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="flex items-center text-blue-400">
                                            <Eye className="w-3 h-3 mr-1" /> {note.downloads}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Action Button */}
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => onNoteView(note)} 
                                className="flex-shrink-0 ml-4"
                            >
                                View Note
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-gray-900 rounded-xl border border-gray-800 border-dashed">
                        <p className="text-gray-500">You haven't uploaded anything yet.</p>
                        <p className="text-sm text-gray-600 mt-1">Use the "Main Dashboard" to upload your first file!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 2. INTERACTIVE PROFILE COMPONENT (CONNECTED TO DB)
// ----------------------------------------------------------------------
const DashboardProfile = ({ userData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Get Auth Context to update user data globally after save
    const { authToken, setUser } = useContext(AuthContext); 

    // Local state for form
    const [formData, setFormData] = useState({
        bio: "",
        interests: "",
        strengths: ""
    });

    // Sync form with props when they load
    useEffect(() => {
        setFormData({
            bio: userData.bio || "",
            interests: userData.interests || "",
            strengths: userData.strengths || ""
        });
    }, [userData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- REAL API SAVE ---
    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Send PUT request to backend
            const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, formData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            // 2. Update Global Context (so UI refreshes immediately)
            setUser(prev => ({ ...prev, ...res.data.user }));
            
            setIsEditing(false);
        } catch (err) {
            console.error("Profile save error", err);
            // Use a simple alert or toast here if available
            alert("Failed to save profile changes.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Revert changes
        setFormData({
            bio: userData.bio || "",
            interests: userData.interests || "",
            strengths: userData.strengths || ""
        });
        setIsEditing(false);
    };

    const renderTags = (stringData, colorClass) => {
        if (!stringData) return <span className="text-gray-500 text-sm italic">Not added yet</span>;
        return stringData.split(',').map((tag, index) => (
            tag.trim() && (
                <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} mr-2 mb-1 border border-opacity-20`}>
                    {tag.trim()}
                </span>
            )
        ));
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">My Profile</h2>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </Button>
                )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="h-32 bg-gradient-to-r from-blue-900 to-purple-900 relative">
                    <div className="absolute -bottom-10 left-8">
                        <div className="w-24 h-24 rounded-full bg-gray-900 p-1">
                            <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                                {userData.name ? userData.name[0].toUpperCase() : 'M'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 pb-8 px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-white">{userData.name}</h1>
                        <p className="text-gray-400">{userData.email}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-300">
                            <span className="flex items-center bg-gray-800 px-3 py-1 rounded-lg"><Hash className="w-4 h-4 mr-2 text-blue-500"/> {userData.userId}</span>
                            <span className="flex items-center bg-gray-800 px-3 py-1 rounded-lg"><Zap className="w-4 h-4 mr-2 text-yellow-500"/> {userData.department || 'MCA'}</span>
                            <span className="flex items-center bg-gray-800 px-3 py-1 rounded-lg"><Calendar className="w-4 h-4 mr-2 text-green-500"/> Joined {userData.joinedDate}</span>
                        </div>
                    </div>

                    <hr className="border-gray-800 my-6" />

                    {isEditing ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">About Yourself</label>
                                <textarea 
                                    name="bio" value={formData.bio} onChange={handleChange} rows="4"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Interests (Comma separated)</label>
                                    <input name="interests" value={formData.interests} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Strengths (Comma separated)</label>
                                    <input name="strengths" value={formData.strengths} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button onClick={handleSave} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-6">
                                    {isLoading ? <><Loader2 className="animate-spin mr-2 w-4 h-4"/> Saving...</> : <><Save className="w-4 h-4 mr-2"/> Save Changes</>}
                                </Button>
                                <Button onClick={handleCancel} variant="ghost" className="text-gray-400 hover:text-white"><X className="w-4 h-4 mr-2"/> Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center"><User className="w-5 h-5 mr-2 text-blue-400"/> About Me</h3>
                                    <p className="text-gray-300 leading-relaxed bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">{userData.bio || "No bio added yet."}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><Heart className="w-5 h-5 mr-2 text-pink-500"/> Interests</h3>
                                    <div className="flex flex-wrap">{renderTags(userData.interests, "bg-pink-900/30 text-pink-300 border-pink-700")}</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><Target className="w-5 h-5 mr-2 text-cyan-500"/> Strengths</h3>
                                    <div className="flex flex-wrap">{renderTags(userData.strengths, "bg-cyan-900/30 text-cyan-300 border-cyan-700")}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 3. NOTES USED COMPONENT
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 3. NOTES USED COMPONENT (LIVE DATA)
// ----------------------------------------------------------------------
const DashboardNotesUsed = ({ onNoteView }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/notes/history`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };

        if (authToken) fetchHistory();
    }, [authToken]);

    if (loading) return <div className="text-gray-400 p-4">Loading history...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Notes Used</h2>
            <p className="text-gray-300">Materials you have recently accessed or downloaded.</p>
            
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                 {history.length > 0 ? history.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                        <div className="flex items-center space-x-4 min-w-0">
                            <div className="p-2 bg-green-900/20 rounded-lg">
                                <BookOpen className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-white truncate">{item.note.title}</p>
                                <div className="flex items-center text-xs text-gray-400 space-x-2">
                                    <span>By {item.note.uploader?.name || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>Accessed: {new Date(item.lastAccessed).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onNoteView(item.note)} // Navigate to Detail Page
                            className="flex-shrink-0 ml-4"
                        >
                            View Again
                        </Button>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800 border-dashed">
                        <p className="text-gray-500 mb-2">No history found.</p>
                        <p className="text-sm text-gray-600">View or download a note to see it appear here!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 4. RESET PASSWORD
// ----------------------------------------------------------------------
const DashboardResetPassword = () => {
    const { authToken } = useContext(AuthContext); 
    const [formData, setFormData] = useState({ current: '', newPass: '', confirmPass: '' });
    const [status, setStatus] = useState('');
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        setStatus('Feature disabled in this version.'); 
    };

    return (
        <div className="w-full max-w-sm mx-auto"> 
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white text-center">Reset Password</h2>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input label="Current Password" value={formData.current} onChange={e=>setFormData({...formData, current: e.target.value})} type="password" />
                        <Input label="New Password" value={formData.newPass} onChange={e=>setFormData({...formData, newPass: e.target.value})} type="password" />
                        <Button type="submit" className="w-full">Update</Button>
                    </form>
                    {status && <p className="text-center text-gray-400 mt-2">{status}</p>}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 5. MAIN DASHBOARD WRAPPER
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 5. MAIN DASHBOARD WRAPPER
// ----------------------------------------------------------------------
const UserDashboard = ({ user, onLogout, onNoteView, onDashboardViewChange, currentView, children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleNoteView = (note) => {
        navigate(`/note/${note._id}`);
    };

    // --- SINGLE SOURCE OF TRUTH FOR USER DATA ---
    const userData = {
        name: user ? user.name : 'Loading...',
        email: user ? user.email : '...',
        userId: user ? (user.googleId || user._id) : '...',
        joinedDate: user ? new Date(user.createdAt).toLocaleDateString() : '...',
        
        // Pass profile fields
        bio: user?.bio,
        interests: user?.interests,
        strengths: user?.strengths
    };

    const menuItems = [
        { name: 'Main Dashboard', icon: 'Aperture', view: 'main' },
        { name: 'Profile', icon: 'User', view: 'profile' },
        { name: 'Contributions', icon: 'Upload', view: 'contributions' },
        { name: 'Leaderboard', icon: 'Award', view: 'topContributors' },
        { name: 'History', icon: 'BookOpen', view: 'notesUsed' },
        { name: 'Settings', icon: 'Lock', view: 'resetPassword' },
    ];

    const renderContent = () => {
        if (children) return children; 
        
        switch (currentView) {
            case 'profile':
                return <DashboardProfile userData={userData} />;
            case 'resetPassword': 
                return <DashboardResetPassword />; 
            case 'contributions':
                return <DashboardContributions user={user} onNoteView={handleNoteView} />;
            case 'notesUsed':
                return <DashboardNotesUsed onNoteView={handleNoteView} />;
            case 'topContributors':
                return <TopContributors />;
            case 'main':
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2">
                           <FileUploadCard onFileUploadSuccess={() => console.log("Refetch needed")} />
                        </div>
                        <div className="lg:col-span-3">
                            <Card className="h-full flex items-center justify-center border-dashed bg-gray-900/50 border-gray-700">
                                <div className="text-center p-6">
                                    <h3 className="text-xl font-bold text-white mb-2">Welcome to MXShare</h3>
                                    <p className="text-gray-400">Select an action from the menu or upload a file.</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 transition-colors duration-300">
            <header className="bg-gray-900 shadow-xl p-4 sticky top-0 z-30 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="relative">
                        <div 
                            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 ring-blue-500 transition-all"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {userData.name[0]}
                        </div>
                        
                        {isMenuOpen && (
                            <div className="absolute top-12 left-0 w-56 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                                <div className="p-3 border-b border-gray-700">
                                    <p className="text-sm font-bold text-white truncate">{userData.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                                </div>
                                <div className="py-1">
                                    {menuItems.map((item) => {
                                        const Icon = LucideIcons[item.icon];
                                        return (
                                            <button
                                                key={item.name}
                                                onClick={() => {
                                                    onDashboardViewChange(item.view);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                                            >
                                                <Icon className="w-4 h-4 mr-3" />
                                                {item.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="border-t border-gray-700 p-1">
                                    <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded">
                                        <LogOut className="w-4 h-4 mr-3" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-xl font-bold text-white hidden sm:block">MXShare Dashboard</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 lg:p-8 pt-6">
                {renderContent()}
            </main>
        </div>
    );
};

export default UserDashboard;