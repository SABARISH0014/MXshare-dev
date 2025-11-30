import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Aperture, LogOut, User, Lock, Upload, BookOpen, 
    Award, LayoutDashboard, Clock, UploadCloud, 
    TrendingUp, Eye, ThumbsUp, Search, Loader2,
    ExternalLink, FileText, ArrowRight, Check, X,
    Heart, Target, Zap, Calendar, Hash, Edit2,
    Github, Linkedin, Globe, GraduationCap, MapPin, 
    Briefcase, Cpu, Key, EyeOff, Flame, Trophy, Medal, Star,
    BarChart3, Sparkles // Added Sparkles for AI
} from 'lucide-react';

// --- IMPORTS ---
import ThemeToggle from '../components/ThemeToggle';
import { Button, Input, Select, Card, CardContent } from '../components/ui/primitives';
import { API_BASE_URL, syllabusData } from '../data/constants';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import FileUploadCard from '../components/FileUploadCard';
import TopContributors from '../components/TopContributors';
import NoteCard from '../components/NoteCard';
import QuestWidget from '../components/QuestWidget';

// Icon Mapping
const LucideIcons = { 
    Aperture, User, Lock, Upload, BookOpen, Award, LogOut, 
    LayoutDashboard, Clock 
};

// ==================================================================================
// 1. VISUAL & GAMIFICATION SUB-COMPONENTS
// ==================================================================================

// --- IMPACT ANALYTICS CHART ---
const ImpactAnalytics = ({ notes = [] }) => {
    const totalViews = notes.reduce((acc, n) => acc + (n.downloads || 0), 0);
    
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days;
    };

    const chartData = getLast7Days().map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const count = notes.filter(n => {
            if (!n.createdAt) return false;
            return n.createdAt.split('T')[0] === dateStr;
        }).length;

        return {
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            val: count,
            fullDate: date.toLocaleDateString()
        };
    });

    const maxVal = Math.max(...chartData.map(d => d.val));
    const scaleMax = maxVal === 0 ? 5 : maxVal;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-500" /> Weekly Uploads
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-gray-900 dark:text-white">{totalViews}</span>
                        <span className="text-sm text-gray-500 font-medium">total lifetime views</span>
                    </div>
                </div>
                 <div className="flex items-center text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg text-xs font-bold">
                    <ArrowRight className="w-3 h-3 mr-1 -rotate-45" /> Live
                </div>
            </div>

            <div className="flex-grow flex items-end justify-between gap-2 md:gap-4 mt-2 h-40">
                {chartData.map((item, i) => {
                    const heightPercentage = (item.val / scaleMax) * 100;
                    const isToday = i === 6;
                    return (
                        <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                {item.val} Uploads on {item.label}
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-lg relative overflow-hidden h-full flex items-end">
                                <div 
                                    className={`w-full rounded-lg transition-all duration-700 ease-out group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] 
                                        ${isToday ? 'bg-gradient-to-t from-indigo-500 to-purple-500' : 'bg-blue-500 dark:bg-blue-600 group-hover:bg-blue-400'}`}
                                    style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                                ></div>
                            </div>
                            <span className={`text-[10px] uppercase font-bold mt-3 ${isToday ? 'text-indigo-500' : 'text-gray-400'}`}>
                                {item.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// --- DYNAMIC BADGE STRIP ---
const BadgeStrip = ({ user, notes = [] }) => {
    const uploadCount = notes.length;
    const totalViews = notes.reduce((acc, n) => acc + (n.downloads || 0), 0);
    const joinDate = new Date(user.createdAt);
    const daysSinceJoined = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));

    const BADGES_CONFIG = [
        { id: 'newbie', icon: Star, label: "Explorer", desc: "Joined the platform", color: "text-yellow-400", condition: () => true },
        { id: 'contributor', icon: Upload, label: "Contributor", desc: "Uploaded 1st note", color: "text-blue-400", condition: () => uploadCount >= 1 },
        { id: 'expert', icon: BookOpen, label: "Scholar", desc: "Uploaded 5+ notes", color: "text-indigo-400", condition: () => uploadCount >= 5 },
        { id: 'visionary', icon: Eye, label: "Visionary", desc: "100+ Total Views", color: "text-green-400", condition: () => totalViews >= 100 },
        { id: 'influencer', icon: Flame, label: "Influencer", desc: "500+ Total Views", color: "text-orange-500", condition: () => totalViews >= 500 },
        { id: 'veteran', icon: Medal, label: "Veteran", desc: "Member for 30 days", color: "text-purple-400", condition: () => daysSinceJoined >= 30 }
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {BADGES_CONFIG.map((b) => {
                const isUnlocked = b.condition();
                return (
                    <div key={b.id} className={`flex flex-col items-center min-w-[100px] p-4 rounded-xl border shadow-sm transition-all duration-300
                        ${isUnlocked ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-blue-300 hover:shadow-md cursor-pointer group' : 'bg-gray-100 dark:bg-slate-900/50 border-transparent opacity-50 grayscale'}`}>
                        <div className={`p-3 rounded-full mb-3 transition-transform shadow-inner ${isUnlocked ? 'bg-gray-50 dark:bg-slate-800 group-hover:scale-110' : 'bg-gray-200 dark:bg-slate-800'}`}>
                            <b.icon className={`w-6 h-6 ${isUnlocked ? b.color : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-xs font-bold text-center ${isUnlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{b.label}</span>
                        <span className="text-[10px] text-gray-400 text-center mt-1">{isUnlocked ? b.desc : <span className="flex items-center justify-center"><Lock className="w-3 h-3 mr-1"/> Locked</span>}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- GAMIFIED HEADER ---
const GamifiedHeader = ({ user, notesCount }) => {
    const level = Math.floor(notesCount / 5) + 1;
    const currentXP = (notesCount % 5) * 20;
    const nextLevelXP = 100;
    const progress = (currentXP / nextLevelXP) * 100;
    const streak = user?.dailyQuestProgress?.streak || 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm mb-8 relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-3xl font-bold text-gray-800 dark:text-white uppercase">
                            {user.name?.[0]}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white dark:border-slate-900 flex items-center shadow-sm">
                        Lvl {level}
                    </div>
                </div>

                <div className="text-center md:text-left flex-grow">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Hello, {user.name?.split(' ')[0]}!</h1>
                    <div className="flex items-center justify-center md:justify-start mt-2 space-x-4 text-sm">
                        <div className="flex items-center text-orange-500 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <Flame className="w-4 h-4 mr-1 fill-orange-500" /> {streak} Day Streak
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-slate-400">
                           <Award className="w-4 h-4 mr-1 text-purple-500" />
                           <span>Scholar Scribe</span>
                        </div>
                    </div>
                </div>
                
                <div className="w-full md:w-64 bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-500 dark:text-slate-400">
                        <span>Level Progress</span>
                        <span>{currentXP} / {nextLevelXP} XP</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                            style={{ width: `${Math.max(progress, 5)}%` }}
                        />
                    </div>
                    <p className="text-[10px] mt-2 text-right text-blue-600 dark:text-blue-400 font-medium">
                        Upload <strong>{5 - (notesCount % 5)}</strong> more to level up
                    </p>
                </div>
             </div>
        </div>
    );
};

// ==================================================================================
// 2. VIEW COMPONENTS
// ==================================================================================

const DashboardResetPassword = () => {
    const { authToken } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    const toggleShow = (field) => setShowPass(prev => ({ ...prev, [field]: !prev[field] }));

    const handleUpdate = async () => {
        if (passwords.new !== passwords.confirm) return addToast("New passwords do not match", "error");
        if (passwords.new.length < 6) return addToast("Password must be at least 6 characters", "error");
        
        setLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/auth/updatepassword`, 
                { currentPassword: passwords.current, newPassword: passwords.new },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            addToast("Password updated successfully!", "success");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to update password", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label, field, placeholder) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                <input 
                    type={showPass[field] ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder={placeholder}
                    value={passwords[field]}
                    onChange={e => setPasswords({...passwords, [field]: e.target.value})}
                />
                <button 
                    onClick={() => toggleShow(field)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-blue-500"
                >
                    {showPass[field] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
                        <Key className="w-6 h-6"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                        <p className="text-sm text-gray-500">Update your password to keep your account safe.</p>
                    </div>
                </div>
                {renderInput("Current Password", "current", "Enter current password")}
                {renderInput("New Password", "new", "Enter new password")}
                {renderInput("Confirm New Password", "confirm", "Confirm new password")}
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-500/30">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Check className="w-4 h-4 mr-2"/>} Update Password
                    </Button>
                </div>
            </div>
        </div>
    );
};

const DashboardProfile = ({ userData, onUpdateUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const { authToken } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        bio: userData.bio || "",
        college: userData.college || "PSG College of Technology",
        department: userData.department || "MCA",
        semester: userData.semester || "1st Year",
        location: userData.location || "Coimbatore, India",
        skills: userData.skills || "C Programming, React, Data Structures",
        github: userData.github || "",
        linkedin: userData.linkedin || "",
        website: userData.website || ""
    });

    useEffect(() => { setFormData(prev => ({ ...prev, ...userData })); }, [userData]);

    const handleSave = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/auth/profile`, formData, { headers: { Authorization: `Bearer ${authToken}` } });
            onUpdateUser({ ...userData, ...formData }); 
            setIsEditing(false);
        } catch (e) { alert("Error saving profile."); }
    };

    const renderSkillTags = (skillsString) => {
        if (!skillsString) return <span className="text-sm text-gray-400 italic">No skills added yet.</span>;
        return skillsString.split(',').map((skill, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mr-2 mb-2 border border-blue-100 dark:border-blue-800 transition-transform hover:scale-105">
                {skill.trim()}
            </span>
        ));
    };

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h2></div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-all shadow-md">
                        <Edit2 className="w-4 h-4 mr-2"/> Edit Profile
                    </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-visible shadow-sm relative mt-12">
                        <div className="h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-t-2xl"></div>
                        <div className="px-6 pb-6 pt-16 relative">
                            <div className="absolute -top-16 left-6">
                                <div className="w-32 h-32 rounded-full border-[6px] border-white dark:border-slate-900 bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-5xl font-bold text-gray-600 dark:text-slate-300 uppercase shadow-lg">
                                    {userData.name?.[0]}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{userData.name}</h1>
                                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{userData.email}</p>
                            </div>
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">Social Connect</h3>
                            <div className="space-y-4">
                                <a href={formData.github} target="_blank" rel="noreferrer" className="flex items-center text-gray-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
                                    <Github className="w-5 h-5 mr-3"/> <span className="truncate">{formData.github || "Github not added"}</span>
                                </a>
                                <a href={formData.linkedin} target="_blank" rel="noreferrer" className="flex items-center text-gray-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
                                    <Linkedin className="w-5 h-5 mr-3"/> <span className="truncate">{formData.linkedin || "LinkedIn not added"}</span>
                                </a>
                                <div className="flex items-center text-gray-600 dark:text-slate-300 p-2">
                                    <Globe className="w-5 h-5 mr-3"/> <span className="truncate">{formData.website || "Website not added"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {isEditing ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-300">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Bio</label>
                                <textarea className="w-full p-3 border rounded-xl dark:bg-slate-950 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" rows="4" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about yourself..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold mb-1">College</label><Input value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                                <div><label className="block text-sm font-bold mb-1">Department</label><Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                                <div><label className="block text-sm font-bold mb-1">Semester</label><Input value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                                <div><label className="block text-sm font-bold mb-1">Location</label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                            </div>
                            <div><label className="block text-sm font-bold mb-1">Skills (comma separated)</label><Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div><label className="block text-sm font-bold mb-1">Github URL</label><Input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                                <div><label className="block text-sm font-bold mb-1">LinkedIn URL</label><Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="bg-gray-50 dark:bg-slate-950 rounded-xl"/></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl">Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center text-gray-900 dark:text-white">
                                    <User className="w-5 h-5 mr-2 text-blue-500"/> About Me
                                </h3>
                                <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                                    {formData.bio || "No bio added yet. Click edit to introduce yourself!"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm h-full">
                                    <h3 className="text-lg font-bold mb-4 flex items-center"><GraduationCap className="w-5 h-5 mr-2 text-purple-500"/> Education</h3>
                                    <div className="space-y-4">
                                        <div><p className="text-xs text-gray-400 uppercase font-bold">College</p><p className="font-medium">{formData.college}</p></div>
                                        <div className="flex gap-4">
                                            <div><p className="text-xs text-gray-400 uppercase font-bold">Dept</p><p className="font-medium">{formData.department}</p></div>
                                            <div><p className="text-xs text-gray-400 uppercase font-bold">Year</p><p className="font-medium">{formData.semester}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm h-full">
                                    <h3 className="text-lg font-bold mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2 text-red-500"/> Location</h3>
                                    <p className="font-medium text-lg text-gray-800 dark:text-gray-200">{formData.location}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center"><Cpu className="w-5 h-5 mr-2 text-green-500"/> Skills & Interests</h3>
                                <div className="flex flex-wrap">{renderSkillTags(formData.skills)}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardContributions = ({ user, onNoteView }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/notes`);
                setNotes(res.data.filter(n => n.uploader?._id === user._id));
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        fetchNotes();
    }, [user]);

    if (loading) return <div className="p-8 text-center flex flex-col items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2"/><span className="text-gray-400">Loading your work...</span></div>;

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Contributions</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">You have shared <span className="font-bold text-blue-600">{notes.length}</span> resources with the community.</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>

            <div className="space-y-4">
                {notes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <UploadCloud className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                        <p className="text-gray-500 font-medium">No contributions yet.</p>
                        <p className="text-sm text-gray-400">Upload your first note to earn badges!</p>
                    </div>
                ) : (
                    notes.map((note, index) => (
                        <div 
                            key={note._id} 
                            style={{ animationDelay: `${index * 100}ms` }}
                            className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 fill-mode-forwards"
                        >
                            <div className="flex items-start md:items-center gap-5 mb-4 md:mb-0">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{note.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(note.createdAt).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-full font-medium">{note.subject}</span>
                                        {note.downloads > 0 && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                                                <span className="flex items-center text-green-600"><Eye className="w-3 h-3 mr-1"/> {note.downloads}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={() => onNoteView(note)}
                                className="bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:border-blue-600 transition-all rounded-xl px-6 py-2 shadow-sm font-medium flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                            >
                                <Eye className="w-4 h-4 mr-2"/> View File
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- SEARCH SECTION WITH AI TOGGLE ---
const DashboardSearchSection = ({ onNoteView, triggerRefresh }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [useAI, setUseAI] = useState(false); // New AI Toggle

    useEffect(() => {
        const fetchRecents = async () => {
             try {
                const res = await axios.get(`${API_BASE_URL}/api/notes`);
                const sorted = res.data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
                setSearchResults(sorted); 
             } catch(e) { console.error(e); }
        };
        fetchRecents();
    }, [triggerRefresh]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            if (useAI && searchQuery.trim()) {
                // Semantic Search Call
                const res = await axios.get(`${API_BASE_URL}/api/notes`, {
                    params: { q: searchQuery, type: 'semantic' }
                });
                setSearchResults(res.data);
            } else {
                // Standard Filter
                const res = await axios.get(`${API_BASE_URL}/api/notes`);
                let results = res.data;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    results = results.filter(n => (
                        n.title?.toLowerCase().includes(q) || 
                        n.uploader?.name?.toLowerCase().includes(q) ||
                        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
                    ));
                }
                setSearchResults(results);
            }
        } catch (err) { console.error(err); } 
        finally { setIsSearching(false); }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center relative z-10">
                    <Search className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400"/> Find Learning Materials
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4 relative z-10">
                    <div className="relative flex-grow w-full group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors duration-300">
                            {isSearching ? (
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            ) : (
                                <Search className={`w-6 h-6 ${useAI ? 'text-indigo-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                            )}
                        </div>
                        
                        <input 
                            type="text"
                            placeholder={useAI ? "Ask AI (e.g. 'Thermodynamics formulas')..." : "Search titles, tags, subjects..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full h-16 pl-14 pr-36 bg-gray-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm hover:shadow-md focus:shadow-lg dark:hover:bg-black/20" 
                        />

                        {/* AI Toggle */}
                        <div 
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            onClick={() => setUseAI(!useAI)}
                            title={useAI ? "Switch to Standard Search" : "Enable AI Semantic Search"}
                        >
                            <span className={`text-xs font-bold transition-colors ${useAI ? 'text-indigo-600' : 'text-gray-400'}`}>AI</span>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${useAI ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-700'}`}>
                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${useAI ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleSearch} 
                        disabled={isSearching} 
                        className={`text-white min-w-[140px] h-16 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 ${useAI ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isSearching ? <Loader2 className="animate-spin w-5 h-5"/> : (useAI ? <><Sparkles className="w-5 h-5 mr-2"/> Ask AI</> : "Search")}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                    {searchQuery ? (useAI ? 'Semantic Matches' : 'Search Results') : 'Recent Uploads'}
                    <span className="ml-3 text-xs bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{searchResults.length}</span>
                </h3>
                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {searchResults.map(note => (
                             <div key={note._id} className="hover:-translate-y-1 transition-transform">
                                <NoteCard note={note} onNavigate={() => onNoteView(note)} />
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-xl border-dashed border-2 border-gray-200 dark:border-slate-800">
                        <p className="text-gray-500">No results found.</p>
                        {useAI && <p className="text-sm text-indigo-500 mt-2">Try rephrasing your query.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardNotesUsed = ({ onNoteView }) => {
    const [history, setHistory] = useState([]);
    const { authToken } = useContext(AuthContext);

    useEffect(() => {
        if (authToken) {
            axios.get(`${API_BASE_URL}/api/notes/history`, { headers: { Authorization: `Bearer ${authToken}` } })
                .then(res => setHistory(res.data))
                .catch(console.error);
        }
    }, [authToken]);

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reading History</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Notes you have viewed recently.</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                        <p className="text-gray-500 font-medium">No history yet.</p>
                        <p className="text-sm text-gray-400">Start exploring notes to build your history!</p>
                    </div>
                ) : (
                    history.map((item, index) => (
                        <div 
                            key={item._id} 
                            style={{ animationDelay: `${index * 100}ms` }}
                            className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4 fill-mode-forwards"
                        >
                            <div className="flex items-start md:items-center gap-5 mb-4 md:mb-0">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <BookOpen className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                        {item.note?.title || "Deleted Note"}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Accessed {new Date(item.lastAccessed).toLocaleDateString()}</span>
                                        {item.note?.subject && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-full">{item.note.subject}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {item.note && (
                                <Button 
                                    onClick={() => onNoteView(item.note)}
                                    className="bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-100 dark:border-purple-800 hover:border-purple-600 transition-all rounded-xl px-5 py-2 shadow-sm font-medium flex items-center justify-center"
                                >
                                    <ArrowRight className="w-4 h-4 mr-2"/> Open Again
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ==================================================================================
// MAIN DASHBOARD PAGE
// ==================================================================================

const DashboardPage = () => {
    const [currentView, setCurrentView] = useState('main');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userNotes, setUserNotes] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const { user, logout, setUser } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();
    const uploaderRef = useRef(null);

    // Fetch User Stats
    useEffect(() => {
        if (user) {
            axios.get(`${API_BASE_URL}/api/notes`)
                .then(res => setUserNotes(res.data.filter(n => n.uploader?._id === user._id)))
                .catch(console.error);
        }
    }, [user, refreshTrigger]);

    const handleLogout = () => {
        if (typeof logout === 'function') {
            logout();
            addToast('Logged out successfully', 'success');
        } else {
            console.warn("Logout function not found. Manually scrubbing storage.");
            const keysToRemove = [
                'userToken', 'authToken', 'refreshToken', 'userData', 'googleAccessToken', 'googleRefreshToken'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            window.location.href = '/login'; 
            return;
        }
        navigate('/login');
    };

    const handleNoteView = (note) => navigate(`/note/${note._id}`);
    const handleUploadClick = () => {
        setCurrentView('main');
        setTimeout(() => uploaderRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const menuItems = [
        { name: 'Dashboard', icon: 'LayoutDashboard', view: 'main' },
        { name: 'Profile', icon: 'User', view: 'profile' },
        { name: 'My Contributions', icon: 'Upload', view: 'contributions' },
        { name: 'Leaderboard', icon: 'Award', view: 'topContributors' },
        { name: 'History', icon: 'BookOpen', view: 'notesUsed' },
        { name: 'Settings', icon: 'Lock', view: 'resetPassword' },
    ];

    const renderContent = () => {
        switch (currentView) {
            case 'profile': return <DashboardProfile userData={user} onUpdateUser={setUser} />;
            case 'contributions': return <DashboardContributions user={user} onNoteView={handleNoteView} />;
            case 'notesUsed': return <DashboardNotesUsed onNoteView={handleNoteView} />;
            case 'topContributors': return <TopContributors />;
            case 'resetPassword': return <DashboardResetPassword />;
            
            case 'main':
            default:
                return (
                    <div className="space-y-8 animate-in fade-in pb-20">
                        {/* 1. Header with Gamification */}
                        <GamifiedHeader user={user} notesCount={userNotes.length} />

                        {/* 2. Top Stats Grid (Graph + Quests) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
                            {/* Left: Bar Graph */}
                            <div className="lg:col-span-8 h-full">
                                <ImpactAnalytics notes={userNotes} />
                            </div>
                            {/* Right: DYNAMIC QUEST WIDGET */}
                            <div className="lg:col-span-4 h-full">
                                <QuestWidget />
                            </div>
                        </div>

                        {/* 3. Middle Grid (Quick Actions + Badges) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Achievements</h3>
                                <BadgeStrip user={user} notes={userNotes} /> 
                            </div>
                            <div className="lg:col-span-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleUploadClick} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center border border-blue-100 dark:border-blue-800">
                                        <UploadCloud className="w-4 h-4 mr-2"/> Upload
                                    </button>
                                    <button onClick={() => setCurrentView('profile')} className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center border border-purple-100 dark:border-purple-800">
                                        <User className="w-4 h-4 mr-2"/> Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Upload & Search */}
                        <div ref={uploaderRef} className="scroll-mt-24 pt-4">
                            <FileUploadCard onFileUploadSuccess={() => setRefreshTrigger(p => p+1)} />
                        </div>
                        <div className="border-t border-gray-200 dark:border-slate-800 pt-8">
                             <DashboardSearchSection onNoteView={handleNoteView} triggerRefresh={refreshTrigger} />
                        </div>
                    </div>
                );
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300 font-sans">
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center hover:ring-4 hover:ring-blue-100 dark:hover:ring-blue-900 transition-all" 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {user.name?.[0]}
                            </button>
                            
                            {isMenuOpen && (
                                <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                <div className="absolute top-12 left-0 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                                        <p className="font-bold truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                                    </div>
                                    <div className="py-2">
                                        {menuItems.map((item) => {
                                            const Icon = LucideIcons[item.icon] || LucideIcons['LayoutDashboard'];
                                            return (
                                                <button 
                                                    key={item.view} 
                                                    onClick={() => { setCurrentView(item.view); setIsMenuOpen(false); }} 
                                                    className={`w-full text-left flex items-center px-4 py-3 text-sm font-medium transition-colors ${currentView === item.view ? 'bg-blue-50 dark:bg-slate-800 text-blue-600' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <Icon className="w-4 h-4 mr-3" /> {item.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-slate-800 p-2">
                                        <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors">
                                            <LogOut className="w-4 h-4 mr-3" /> Logout
                                        </button>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="font-bold text-lg">MXShare</span>
                            <span className="text-gray-300 dark:text-slate-700">/</span>
                            <span className="text-blue-600 font-medium">
                                {currentView === 'main' ? 'Dashboard' : menuItems.find(i => i.view === currentView)?.name}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {currentView !== 'main' && (
                            <Button variant="ghost" size="sm" onClick={() => setCurrentView('main')} className="hidden md:flex">
                                <LayoutDashboard className="w-5 h-5 mr-2" /> Dashboard
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default DashboardPage;