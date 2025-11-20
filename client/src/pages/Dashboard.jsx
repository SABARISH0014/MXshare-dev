import React, { useState, useContext } from 'react';
import { Aperture, LogOut, User, Lock, Upload, BookOpen, Award, Hash, Calendar, Zap, FileText, Menu } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../components/ui/primitives";
import { API_BASE_URL } from '../data/constants';
import { AuthContext } from '../context/AuthContext';
import FileUploadCard from '../components/FileUploadCard';
import TopContributors from '../components/TopContributors';

const LucideIcons = { Aperture, User, Lock, Upload, BookOpen, Award, LogOut };

// --- Sub Components ---

const DashboardProfile = ({ userData }) => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">My Profile</h2>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-gray-700">
            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {userData.name ? userData.name[0].toUpperCase() : 'M'}
                </div>
                <div>
                    <p className="text-xl font-semibold text-white">{userData.name}</p>
                    <p className="text-sm text-gray-400">{userData.email}</p>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-300">
                    <Hash className="w-4 h-4 mr-2 text-blue-500" />
                    ID: <span className="ml-1 font-mono text-xs">{userData.userId}</span>
                </div>
                <div className="flex items-center text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Joined: {userData.joinedDate}
                </div>
                <div className="flex items-center text-gray-300 col-span-2">
                    <Zap className="w-4 h-4 mr-2 text-blue-500" />
                    Department: {userData.department}
                </div>
            </div>
        </div>
        <Button variant="outline" className="w-full">Edit Profile Details</Button>
    </div>
);

const DashboardResetPassword = () => {
    const { authToken } = useContext(AuthContext); 
    const [formData, setFormData] = useState({ current: '', newPass: '', confirmPass: '' });
    const [status, setStatus] = useState('');
    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

    const handleSubmit = async (e) => { 
        e.preventDefault();
        setStatus('');
        
        if (formData.newPass !== formData.confirmPass) {
            setStatus('Error: New passwords do not match.');
            return;
        }
        if (formData.newPass.length < 8) {
            setStatus('Error: New password must be at least 8 characters.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    currentPassword: formData.current,
                    newPassword: formData.newPass
                })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus('Success: Your password has been set and updated securely.');
                setFormData({ current: '', newPass: '', confirmPass: '' });
            } else {
                setStatus(`Error: ${data.message || 'Update failed.'}`);
            }
        } catch (error) {
            setStatus('Error: Network connection failed.');
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto"> 
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white text-center">Reset Password</h2>
                <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
                    <p className="text-gray-300 mb-4">Use the form below to update your account password.</p>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input label="Current Password" id="current" type="password" value={formData.current} onChange={handleChange} required />
                        <Input label="New Password (min 8 chars)" id="newPass" type="password" value={formData.newPass} onChange={handleChange} required />
                        <Input label="Confirm New Password" id="confirmPass" type="password" value={formData.confirmPass} onChange={handleChange} required />
                        <Button type="submit" className="w-full"> Update Password </Button>
                    </form>
                    {status && (
                        <p className={`mt-4 text-center p-2 rounded-lg ${status.startsWith('Error') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                            {status}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardContributions = ({ notes, onNoteView }) => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">My Contributions ({notes.length})</h2>
        <p className="text-gray-300">A full record of all academic notes you have shared with the MXShare community.</p>
        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
             {notes.length > 0 ? notes.map((note) => (
                <div key={note.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg shadow-sm border border-gray-800">
                    <div className="flex items-center space-x-4 min-w-0">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-base font-semibold text-white truncate">{note.title}</p>
                            <p className="text-sm text-gray-400">Uploaded: {note.date}</p>
                        </div>
                    </div>
                    <Button size="default" variant="ghost" onClick={() => onNoteView(note)} className="flex-shrink-0 ml-4 h-8 px-3 text-sm">
                        Manage
                    </Button>
                </div>
            )) : (
               <p className="p-4 text-center bg-gray-800/50 rounded-lg text-gray-400 border border-gray-800">No notes uploaded yet. Start sharing!</p>
            )}
        </div>
    </div>
);

const DashboardNotesUsed = ({ onNoteView }) => {
    const usedNotes = [
        { id: 101, title: 'Quantum Mechanics II (Prof. A)', date: '2025-11-01', contributor: 'Priya R.' },
        { id: 102, title: 'History of Modern India Summary', date: '2025-10-15', contributor: 'Arun K.' },
        { id: 103, title: 'Data Structures: Hash Tables', date: '2025-09-20', contributor: 'Karthik Sundar' },
    ];
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Notes Used ({usedNotes.length})</h2>
            <p className="text-gray-300">A historical log of the notes you have viewed or downloaded.</p>
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                 {usedNotes.map((note) => (
                    <div key={note.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg shadow-sm border border-gray-800">
                        <div className="flex items-center space-x-4 min-w-0">
                            <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-base font-semibold text-white truncate">{note.title}</p>
                                <p className="text-sm text-gray-400">By: {note.contributor} | Accessed: {note.date}</p>
                            </div>
                        </div>
                        <Button size="default" variant="outline" onClick={() => onNoteView(note)} className="flex-shrink-0 ml-4 h-8 px-3 text-sm">
                            View Again
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Dashboard Layout ---

const UserDashboard = ({ user, onLogout, onNoteView, onDashboardViewChange, currentView, children, allNotes, setAllNotes }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const userData = {
        name: user ? user.name : 'Loading...',
        email: user ? user.email : '...',
        userId: user ? (user.googleId || user._id) : '...',
        joinedDate: user ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...',
        department: 'Master of Computer Applications (2023 Reg.)' 
    };

    const handleFileUploadSuccess = (newNoteData) => {
        // Logic for adding note to list if needed
    };

    const menuItems = [
        { name: 'Main Dashboard', icon: 'Aperture', view: 'main' },
        { name: 'Profile', icon: 'User', view: 'profile' },
        { name: 'Reset Password', icon: 'Lock', view: 'resetPassword' },
        { name: 'Contributions', icon: 'Upload', view: 'contributions' },
        { name: 'Notes Used', icon: 'BookOpen', view: 'notesUsed' },
        { name: 'Top Contributors', icon: 'Award', view: 'topContributors' },
    ];

    const renderContent = () => {
        if (children) { return children; } 
        
        switch (currentView) {
            case 'profile':
                return <DashboardProfile userData={userData} />;
            case 'resetPassword': 
                return <DashboardResetPassword />; 
            case 'contributions':
                if (!user || !user._id) {
                    return <div className="text-gray-400 p-6">Loading contributions...</div>;
                }
                return <DashboardContributions 
                    notes={allNotes.filter(n => n.uploader && n.uploader._id === user._id)} 
                    onNoteView={onNoteView} 
                />;
            case 'notesUsed':
                return <DashboardNotesUsed onNoteView={onNoteView} />;
            case 'topContributors':
                return <TopContributors />;
            case 'main':
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2">
                           <FileUploadCard onFileUploadSuccess={handleFileUploadSuccess} />
                        </div>
                        <div className="lg:col-span-3">
                            {/* Content for main dashboard feed can go here */}
                            <Card><CardHeader><CardTitle>Welcome Back</CardTitle></CardHeader><CardContent>Select a menu item to begin.</CardContent></Card>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 transition-colors duration-300">
            <header className="bg-gray-900 shadow-xl p-4 sticky top-0 z-30 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div 
                        className="relative p-2 cursor-pointer rounded-full transition-colors duration-150 hover:bg-gray-800" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-blue-900/50 transition-shadow duration-200" title="Open Menu">
                            {user && user.name ? user.name[0].toUpperCase() : 'M'}
                        </div>

                        <div className={`absolute top-14 left-0 w-56 bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 transform origin-top-left ${isMenuOpen ? 'opacity-100 translate-y-0 visible scale-100' : 'opacity-0 -translate-y-2 invisible scale-95'} border border-gray-700 z-50`}>
                            <div className="p-2 space-y-1">
                                <p className="p-2 text-sm text-white font-bold border-b border-gray-700 truncate">
                                    {user && user.name ? user.name : 'Loading...'}
                                </p>
                                {menuItems.map(({ name, icon, view }) => {
                                    const Icon = LucideIcons[icon];
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => {
                                                onDashboardViewChange(view);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left flex items-center p-2 text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Icon className="w-4 h-4 mr-3 text-blue-400" />
                                            {name}
                                        </button>
                                    );
                                })}

                                <Button
                                  onClick={() => {
                                    onLogout();
                                    setIsMenuOpen(false);
                                  }}
                                  variant="ghost"
                                  className="w-full justify-start text-red-500 hover:bg-red-900/20"
                                >
                                    <LogOut className="w-4 h-4 mr-3" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">MXShare Dashboard</h1>
                    <div className="w-12 h-12"></div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 lg:p-8 pt-6">
                {renderContent()}
            </main>
        </div>
    );
};

export default UserDashboard;