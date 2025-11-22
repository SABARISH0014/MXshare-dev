import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Aperture, LogOut, User, Lock, Upload, BookOpen, 
    Award, Hash, Calendar, Zap, FileText, Menu, 
    ExternalLink, Eye, Loader2, Edit2, Save, X, Heart, Target,
    Search, Filter, ArrowRight 
} from 'lucide-react';

import { Button, Input, Card, CardHeader, CardTitle, CardContent, Select } from '../components/ui/primitives';
import { API_BASE_URL, syllabusData } from '../data/constants';
import { AuthContext } from '../context/AuthContext';
import FileUploadCard from '../components/FileUploadCard';
import TopContributors from '../components/TopContributors';

const LucideIcons = { Aperture, User, Lock, Upload, BookOpen, Award, LogOut };

// ----------------------------------------------------------------------
// 1. CONTRIBUTIONS COMPONENT
// ----------------------------------------------------------------------
const DashboardContributions = ({ user, onNoteView }) => {
    const [myNotes, setMyNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyNotes = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/notes`);
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

    if (loading) return <div className="text-gray-500 flex items-center p-6"><Loader2 className="animate-spin mr-2"/> Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">My Contributions ({myNotes.length})</h2>
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                {myNotes.length > 0 ? myNotes.map((note) => (
                    <div key={note._id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 transition-colors">
                        <div className="flex items-center space-x-4 min-w-0 overflow-hidden">
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                {note.videoUrl ? <ExternalLink className="w-5 h-5 text-red-500" /> : <FileText className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-semibold text-gray-900 truncate">{note.title}</p>
                                <div className="flex items-center text-xs text-gray-500 space-x-3">
                                    <span>{note.subject}</span>
                                    <span>•</span>
                                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="flex items-center text-blue-600"><Eye className="w-3 h-3 mr-1" /> {note.downloads}</span>
                                </div>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onNoteView(note)} className="flex-shrink-0 ml-4 bg-white text-gray-700 border-gray-300 hover:bg-gray-50">View</Button>
                    </div>
                )) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                        <p className="text-gray-500">You haven't uploaded anything yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 2. PROFILE COMPONENT
// ----------------------------------------------------------------------
const DashboardProfile = ({ userData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { authToken, setUser } = useContext(AuthContext); 
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData({
            bio: userData.bio || "",
            interests: userData.interests || "",
            strengths: userData.strengths || ""
        });
    }, [userData]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, formData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setUser(prev => ({ ...prev, ...res.data.user }));
            setIsEditing(false);
        } catch (err) {
            alert("Failed to save profile changes.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderTags = (str, cls) => str ? str.split(',').map((t, i) => <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${cls} mr-2 mb-2 border inline-block shadow-sm`}>{t.trim()}</span>) : <span className="text-gray-400 text-xs italic">Add some tags...</span>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
                {!isEditing && <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"><Edit2 className="w-4 h-4 mr-2" /> Edit</Button>}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute -bottom-10 left-8 p-1 bg-white rounded-full shadow-md">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-blue-600 text-4xl font-bold">{userData.name?.[0]}</div>
                    </div>
                </div>
                
                <div className="pt-12 pb-8 px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                        <p className="text-gray-500">{userData.email}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                            <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full"><Hash className="w-3 h-3 mr-2 text-blue-500"/> {userData.userId || 'ID'}</span>
                            <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full"><Zap className="w-3 h-3 mr-2 text-yellow-500"/> {userData.department || 'MCA'}</span>
                            <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full"><Calendar className="w-3 h-3 mr-2 text-green-500"/> Joined {userData.joinedDate}</span>
                        </div>
                    </div>

                    <hr className="border-gray-100 my-6" />

                    {isEditing ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Interests (comma separated)</label>
                                    <input name="interests" value={formData.interests} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Strengths (comma separated)</label>
                                    <input name="strengths" value={formData.strengths} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6">{isLoading?"Saving...":"Save Changes"}</Button>
                                <Button variant="ghost" onClick={()=>setIsEditing(false)} className="text-gray-600 hover:bg-gray-100">Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><User className="w-5 h-5 mr-2 text-blue-600"/> About Me</h3>
                                <p className="text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    {userData.bio || "No bio added yet."}
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div><h3 className="text-gray-900 font-semibold mb-3 flex items-center"><Heart className="w-5 h-5 mr-2 text-pink-500"/> Interests</h3>{renderTags(userData.interests, "bg-pink-50 text-pink-700 border-pink-200")}</div>
                                <div><h3 className="text-gray-900 font-semibold mb-3 flex items-center"><Target className="w-5 h-5 mr-2 text-cyan-600"/> Strengths</h3>{renderTags(userData.strengths, "bg-cyan-50 text-cyan-700 border-cyan-200")}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 3. HISTORY COMPONENT
// ----------------------------------------------------------------------
const DashboardNotesUsed = ({ onNoteView }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);

    useEffect(() => {
        if (!authToken) return;
        axios.get(`${API_BASE_URL}/api/notes/history`, { headers: { Authorization: `Bearer ${authToken}` } })
             .then(res => setHistory(res.data))
             .catch(console.error)
             .finally(() => setLoading(false));
    }, [authToken]);

    if (loading) return <div className="text-gray-500 p-6">Loading history...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">History</h2>
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                 {history.length > 0 ? history.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-green-400 transition-colors">
                        <div className="flex items-center space-x-4 min-w-0">
                            <div className="p-2 bg-green-50 rounded-lg border border-green-100"><BookOpen className="w-5 h-5 text-green-600" /></div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{item.note?.title || 'Deleted Note'}</p>
                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                    <span>By {item.note?.uploader?.name || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>Accessed {new Date(item.lastAccessed).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => item.note && onNoteView(item.note)} className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">View Again</Button>
                    </div>
                )) : <div className="text-center p-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed text-gray-500">No history yet.</div>}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 4. SETTINGS COMPONENT
// ----------------------------------------------------------------------
const DashboardResetPassword = () => {
    return <div className="text-gray-500 text-center p-10 bg-gray-50 rounded-xl border border-gray-200">Feature Disabled in Demo Mode</div>;
};

// ----------------------------------------------------------------------
// 5. MAIN DASHBOARD
// ----------------------------------------------------------------------
const UserDashboard = ({ user, onLogout, onNoteView, onDashboardViewChange, currentView, children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notes`);
            let results = res.data;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                // --- FIX: Added Safety Check for uploader.name ---
                results = results.filter(n => 
                    (n.title && n.title.toLowerCase().includes(q)) || 
                    (n.uploader && n.uploader.name && n.uploader.name.toLowerCase().includes(q))
                );
            }
            if (selectedSubject) {
                results = results.filter(n => n.subject === selectedSubject);
            }
            setSearchResults(results);
        } catch (err) {
            console.error("Search error", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleNoteView = (note) => navigate(`/note/${note._id}`);

    const userData = {
        name: user ? user.name : 'Loading...',
        email: user ? user.email : '...',
        userId: user ? (user.googleId || user._id) : '...',
        joinedDate: user ? new Date(user.createdAt).toLocaleDateString() : '...',
        bio: user?.bio, interests: user?.interests, strengths: user?.strengths
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
            case 'profile': return <DashboardProfile userData={userData} />;
            case 'resetPassword': return <DashboardResetPassword />; 
            case 'contributions': return <DashboardContributions user={user} onNoteView={handleNoteView} />;
            case 'notesUsed': return <DashboardNotesUsed onNoteView={handleNoteView} />;
            case 'topContributors': return <TopContributors />;
            case 'main':
            default:
                return (
                    <div className="space-y-8">
                        {/* SEARCH BAR */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <Search className="w-6 h-6 mr-3 text-blue-600"/> Find Learning Materials
                            </h2>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-grow">
                                    <Input 
                                        placeholder="Search by title, topic, or contributor..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-12 bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl placeholder-gray-400"
                                    />
                                </div>
                                <div className="w-full md:w-64">
                                    <Select 
                                        value={selectedSubject} 
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="h-12 bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                                    >
                                        <option value="">All Subjects</option>
                                        {syllabusData.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                </div>
                                <Button 
                                    onClick={handleSearch} 
                                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 rounded-xl transition-all"
                                    disabled={isSearching}
                                >
                                    {isSearching ? <Loader2 className="animate-spin"/> : "Search"}
                                </Button>
                            </div>
                        </div>

                        {/* GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-2">
                               <FileUploadCard onFileUploadSuccess={() => handleSearch()} /> 
                            </div>

                            <div className="lg:col-span-3">
                                {searchResults.length > 0 ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center justify-between px-1">
                                            <span>Found {searchResults.length} Results</span>
                                            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Recent</span>
                                        </h3>
                                        {searchResults.map(note => (
                                            <Card key={note._id} className="bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group" onClick={() => handleNoteView(note)}>
                                                <CardContent className="p-5 flex items-center justify-between">
                                                    <div className="flex items-center space-x-4 overflow-hidden">
                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-blue-50 transition-colors">
                                                            {note.videoUrl ? <ExternalLink className="w-6 h-6 text-red-500"/> : <FileText className="w-6 h-6 text-blue-600"/>}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">{note.title}</h4>
                                                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                                                <span className="font-medium text-gray-700">{note.subject}</span>
                                                                <span className="mx-2">•</span>
                                                                <User className="w-3 h-3 mr-1"/> {note.uploader?.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-gray-400 text-sm flex items-center bg-gray-50 px-3 py-1 rounded-full">
                                                            <Eye className="w-4 h-4 mr-1.5"/> {note.downloads}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleNoteView(note); 
                                                            }}
                                                            className="p-1 rounded-full hover:bg-blue-50 transition-colors"
                                                        >
                                                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="h-full min-h-[300px] flex items-center justify-center border-dashed bg-white border-gray-200 shadow-none rounded-2xl">
                                        <div className="text-center p-8 text-gray-400">
                                            <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4 border border-gray-100">
                                                <Search className="w-8 h-8 text-gray-300"/>
                                            </div>
                                            <p className="font-medium text-gray-600 text-lg">No results found</p>
                                            <p className="text-sm mt-1 text-gray-500">Try searching for a topic or subject.</p>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 font-sans">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-30 border-b border-gray-200 backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105 transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {userData.name[0]}
                        </div>
                        {isMenuOpen && (
                            <div className="absolute top-14 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{userData.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                                </div>
                                <div className="py-2">
                                    {menuItems.map((item) => {
                                        const Icon = LucideIcons[item.icon];
                                        return (
                                            <button key={item.name} onClick={() => { onDashboardViewChange(item.view); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium">
                                                <Icon className="w-4 h-4 mr-3" /> {item.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="border-t border-gray-100 p-2">
                                    <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                                        <LogOut className="w-4 h-4 mr-3" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Aperture className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight hidden sm:block">MXShare <span className="text-blue-600">Hub</span></h1>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default UserDashboard;