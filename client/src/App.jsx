import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import ReactDOM from 'react-dom/client';
// --- NEW IMPORTS ---
import { BrowserRouter, Routes, Route, Link as RouterLink, useNavigate, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
// --- DELETED --- (Change 3)
axios.defaults.withCredentials = true;

// --- NEW: Attach JWT token automatically ---
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});




// Use the hook, not the pre-built button
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Aperture, Search, Zap, Shield, PlayCircle, BookOpen, LogIn, UserPlus, X, Bell, Loader2, Lightbulb, Clipboard, User, Lock, Upload, LogOut, FileText, Calendar, Hash, File, Send, CheckCircle, Star, Award, TrendingUp, Download, Eye, MessageSquare, Menu, ArrowLeft } from 'lucide-react';


// --- ADD THIS IMPORT ---
import { socket } from './socket';
// --- YOUR CLIENT ID ---
// Replace this with the Client ID you got from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = 'http://localhost:3001';

// const REDIRECT_URL = import.meta.env.REDIRECT_URL; // <-- REMOVED


// --- LUCIDE ICONS OBJECT ---
const LucideIcons = {
  Aperture, Search, Zap, Shield, BookOpen, LogIn, UserPlus, X, Bell, Loader2, Lightbulb, Clipboard, User, Lock, Upload, LogOut, FileText, Calendar, Hash, File, Send, CheckCircle, Star, Award, TrendingUp, Download, Eye, MessageSquare, Menu
};

// --- SYLLABUS DATA (From PDF) ---
const syllabusData = {
  semesters: [
    { name: "Semester 1", value: "sem1" },
    { name: "Semester 2", value: "sem2" },
    { name: "Semester 3", value: "sem3" },
    { name: "Semester 4", value: "sem4" }
  ],
  subjects: [
    "Mathematical Foundations of Computer Science", "Structured Programming Concepts", "Data Structures", "Database Systems", "Web Technologies",
    "Software Engineering", "Design and Analysis of Algorithms", "Object Oriented Programming using Java", "Enterprise Computing Using Full Stack",
    "Cloud Computing", "Project Work", "Accounting and Financial Management", "Applied Graph Theory", "Artificial Intelligence", "Block Chain Technologies and Use Cases",
    "Computer Networks", "Data Mining and Analytics", "Deep Learning", "Design Patterns", "DevOps", "Entrepreneurship", "Human Computer Interaction",
    "Internet of Things", "Machine Learning", "Multidimensional Data Structures", "Numerical Methods", "Open Source Systems", "Operating Systems",
    "Optimization Techniques", "Principles of Compiler Design", "Principles of Management and Behavioural Sciences", "Security in Computing",
    "Social Networking and Web Mining", "Soft Computing", "Software Project Management", "Software Testing", "Ubiquitous and Pervasive Computing",
    "Virtual Reality Systems", "Wireless Networks"
  ].sort()
};

// --- UTILITY DATA & MOCKS ---
const MOCK_API_KEY = "";
const MOCK_USER_ID = 'psgtech-2304';
const MOCK_USER_NAME = 'Karthik Sundar';
const EMAIL_REGEX = /^\d+[a-zA-Z]+\d+@psgtech\.ac\.in$/i;

const mockNoteList = [
    { id: 1, title: 'Cloud Computing (Unit 1 & 2)', date: '2025-11-15', contributor: 'Karthik Sundar', subject: 'Cloud Computing', downloads: 120, rating: 4.8 },
    { id: 2, title: 'Complete Data Structures Unit 1-5', date: '2025-10-28', contributor: 'Priya R.', subject: 'Data Structures', downloads: 85, rating: 4.2 },
    { id: 3, title: 'Supervised vs Unsupervised ML', date: '2025-09-10', contributor: 'Arun K.', subject: 'Machine Learning', downloads: 200, rating: 4.9 },
    { id: 4, title: 'DBMS 2-Mark Questions', date: '2025-12-01', contributor: 'Nisha V.', subject: 'Database Systems', downloads: 90, rating: 4.5 },
    { id: 5, title: 'Full Stack MERN Architecture Diagram', date: '2025-11-20', contributor: 'Vikram S.', subject: 'Enterprise Computing Using Full Stack', downloads: 150, rating: 4.7 },
];
const mockContributors = [
    { id: 1, name: 'Priya R.', department: 'ECE', score: 980, notes: 45, reviews: 150, rating: 4.9 },
    { id: 2, name: 'Arun K.', department: 'Mech', score: 870, notes: 32, reviews: 90, rating: 4.7 },
    { id: 3, name: 'Nisha V.', department: 'CSE', score: 750, notes: 55, reviews: 110, rating: 4.5 },
    { id: 4, name: 'Vikram S.', department: 'IT', score: 620, notes: 28, reviews: 60, rating: 4.3 },
    { id: 5, name: 'Sanjay A.', department: 'EEE', score: 500, notes: 12, reviews: 45, rating: 4.1 },
];

const fetchMiniMaxContent = async (userQuery, systemPrompt, retries = 3) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const text = systemPrompt && systemPrompt.includes("Output ONLY a comma-separated list")
        ? "Electromagnetic Wave Analysis, RF Circuit Design Principles, Antenna Theory and Applications"
        : "The second law of thermodynamics governs the direction of physical processes, ensuring entropy increase in isolated systems, and setting limits on heat engine efficiency.";
    return { text };
};


// --- UTILITY COMPONENTS (Shadcn Aesthetics) ---
const Card = ({ children, className = '' }) => (
    <div className={`rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-md text-gray-100 shadow-lg ${className}`}>
        {children}
    </div>
);
const CardHeader = ({ children }) => (
    <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);
const CardTitle = ({ children }) => (
    <h3 className="font-semibold leading-none tracking-tight text-xl text-white">{children}</h3>
);
const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';
    const sizeClasses = { default: 'h-10 px-4 py-2', lg: 'h-12 px-6 py-3 text-lg', icon: 'h-10 w-10' }[size];
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
        outline: 'border border-blue-700 text-blue-400 hover:bg-blue-900/20',
        ghost: 'hover:bg-gray-800 text-gray-200',
        secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600',
    }[variant];
    return (
        <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} transform active:scale-[0.98]`} {...props}>
            {children}
        </button>
    );
};

const Input = ({ label, id, type = 'text', className = '', ...props }) => (
    <div className="space-y-2 w-full">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
            {label}
        </label>
        <input
            id={id}
            type={type}
            className={`flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    </div>
);

const Select = ({ label, id, children, className = '', ...props }) => (
    <div className="space-y-2 w-full">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
            {label}
        </label>
        <select
            id={id}
            className={`flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </select>
    </div>
);

const NoteCard = ({ note, onNavigate }) => {
    const { addToast } = useContext(ToastContext);
    const handleView = () => {
        addToast("Please log in to view this note.", "info");
        onNavigate('login');
    };

    return (
      <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-1 hover:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg h-14 line-clamp-2 text-white" title={note.title}>{note.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <p className="text-sm text-gray-400">
            Subject: <span className="font-medium text-gray-300">{note.subject}</span>
          </p>
          <div className="flex justify-between text-sm text-gray-300">
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" /> {note.rating}
            </span>
            <span className="flex items-center">
              <Download className="w-4 h-4 mr-1" /> {note.downloads}
            </span>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
           <Button variant="outline" className="w-full" onClick={handleView}>
             View Note
           </Button>
        </div>
      </Card>
    );
};


// --- CONTEXT & NOTIFICATIONS ---

// --- FIX: AuthContext must be defined here ---
const AuthContext = createContext(null);
// --- END FIX ---

const ToastContext = createContext(null);
const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // 1. Wrap removeToast in useCallback. It has no dependencies.
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []); // <-- This function is now stable

  // 2. Wrap addToast in useCallback and add removeToast to its dependencies.
  const addToast = useCallback((message, type = 'default') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]); // <-- This function is now ALSO stable

  // Socket.IO Listener
  useEffect(() => {
    // 3. This hook will now run only once, as addToast is stable.
    addToast('System: Real-time service initialized.', 'success');

    socket.on('fileUploaded', (data) => {
      console.log('Socket event received:', data);
      addToast(data.message, 'info');
    });

    return () => { socket.off('fileUploaded'); };
  }, [addToast]); // <-- This is now correct

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center p-4 rounded-lg shadow-xl text-sm ${toast.type === 'success' ? 'bg-green-600' : (toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600')} text-white`}>
            <Bell className="w-5 h-5 mr-3" />
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-4 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- LLM Feature Component: Note Title Suggestor ---
const NoteTitleSuggestor = () => {
    const [description, setDescription] = useState('');
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useContext(ToastContext);

    const generateTitles = async () => {
        if (description.trim().length < 10) {
            setError('Please enter a description of at least 10 characters.');
            return;
        }
        setLoading(true);
        setError('');
        setTitles([]);
        const userQuery = `Generate 5 alternative, creative, formal, and clear titles for an academic note based on this content description: "${description}".`;
        const systemPrompt = "You are an expert academic editor and title generator for a student notes platform. Output ONLY a comma-separated list of 5 titles. Do not include introductory phrases, numbering, or quotation marks.";
        try {
            const response = await fetchMiniMaxContent(userQuery, systemPrompt, null);
            const generatedTitles = response.text.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 5);
            if (generatedTitles.length > 0) {
                setTitles(generatedTitles);
                addToast('Titles generated successfully!', 'success');
            } else {
                 setError('AI could not generate suitable titles.');
            }
        } catch (err) {
            setError(`Error calling MiniMax M2 API: ${err.message}`);
            addToast('Title generation failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            addToast('Copied to clipboard!', 'info');
        } catch (err) {
            console.error('Copy failed:', err);
            addToast('Copy failed (unsupported browser).', 'error');
        }
    };

    return (
        <div className="p-6 bg-gray-900 border border-blue-900/30 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" /> AI Note Title Suggestor
            </h3>
            <p className="text-sm text-gray-300">
                Describe the content of your note below, and let MiniMax M2 suggest 5 professional titles.
            </p>
            <div className="space-y-3">
                <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="E.g., Summary of Laplace Transforms focusing on solving linear ODEs..."
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value);
                        if (e.target.value.length >= 10) setError('');
                    }}
                />
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                <Button onClick={generateTitles} disabled={loading || description.trim().length < 10} className="w-full">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Zap className="mr-2 h-4 w-4" /> Generate Titles</>}
                </Button>
            </div>
            {titles.length > 0 && (
                <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-md font-semibold mb-2 text-blue-400">Suggestions:</h4>
                    <ul className="space-y-2">
                        {titles.map((title, index) => (
                            <li key={index} className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg text-sm font-medium text-gray-200">
                                <span className="truncate pr-4">{title}</span>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(title)} title="Copy Title" className="p-1">
                                    <Clipboard className="w-4 h-4 text-blue-400 hover:text-blue-200" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- Auth Components ---

const AuthForm = ({ type, onNavigate, onAuthSuccess }) => {
  const isLogin = type === "Login";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useContext(ToastContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError("");
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: "openid profile email https://www.googleapis.com/auth/drive.file",
    redirect_uri: "http://localhost:5173/auth/google/callback",
    onError: () => addToast("Google Sign-In failed.", "error"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(formData.email)) {
      setError("Access restricted: Please use your official MCA roll no. (e.g., 25MX343@psgtech.ac.in).");
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const mockUser = {
        name: isLogin ? formData.email.split("@")[0] : formData.name,
        email: formData.email,
        _id: "mock_id_" + Date.now(),
        createdAt: new Date().toISOString(),
      };

      addToast(`${isLogin ? "Welcome back" : "Welcome aboard"}, MXian!`, "success");
      onAuthSuccess("mock_local_token_123", mockUser, "mock_local_refresh_token");
    } catch (err) {
      setError("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const formTitle = isLogin ? "Login to MXShare" : "Join MXShare Today";
  const ctaText = isLogin ? "Sign In Securely" : "Create Account";

  return (
    // The parent div must be 'relative' for the absolute button to position correctly
    <div className="relative flex justify-center items-center min-h-screen bg-gray-950 p-4">
      
      {/* --- Back Button --- */}
      <button 
        onClick={() => onNavigate('')} // Navigate to root ('/')
        className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Home
      </button>
      {/* ------------------- */}

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <h2 className="text-3xl font-extrabold text-white text-center">
          {formTitle}
        </h2>
        <p className="text-center text-sm text-blue-400 font-semibold">
          MCA Department Access Only
        </p>

        <Button
          onClick={() => googleLogin()}
          variant="secondary"
          className="w-full flex items-center justify-center space-x-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.611 20.083H42V20H24V28H36.444C35.278 31.833 32.222 34.722 28.5 35.5V36H24C16.8 36 11 30.2 11 23C11 15.8 16.8 10 24 10C27.917 10 31.25 11.417 33.75 13.889L37.111 10.556C33.167 6.778 28.833 5 24 5C13.889 5 5 13.889 5 23C5 32.111 13.889 41 24 41C34.111 41 43 32.111 43 23C43 21.722 43.444 20.889 43.611 20.083Z" fill="#FFC107"/>
                <path d="M24 41C34.111 41 43 32.111 43 23C43 21.722 43.444 20.889 43.611 20.083H42V20H24V28H36.444C35.278 31.833 32.222 34.722 28.5 35.5V36H24C16.8 36 11 30.2 11 23C11 15.8 16.8 10 24 10C27.917 10 31.25 11.417 33.75 13.889L37.111 10.556C33.167 6.778 28.833 5 24 5C13.889 5 5 13.889 5 23C5 32.111 13.889 41 24 41Z" fill="#4CAF50"/>
                <path d="M24 10C27.917 10 31.25 11.417 33.75 13.889L37.111 10.556C33.167 6.778 28.833 5 24 5C13.889 5 5 13.889 5 23C5 32.111 13.889 41 24 41C34.111 41 43 32.111 43 23C43 21.722 43.444 20.889 43.611 20.083H42V20H24V28H36.444C35.278 31.833 32.222 34.722 28.5 35.5V36H24C16.8 36 11 30.2 11 23C11 15.8 16.8 10 24 10Z" fill="#1976D2"/>
              </svg>
              Sign In with College Google
            </>
          )}
        </Button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">or using email</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm font-medium text-red-500 text-center bg-red-900/20 p-2 rounded-lg">
              {error}
            </p>
          )}

          {!isLogin && (
            <Input
              label="Full Name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          <Input
            label="College Email (e.g. 25MX343@psgtech.ac.in)"
            id="email"
            type="email"
            placeholder="25MX343@psgtech.ac.in"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {!isLogin && (
            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : ctaText}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account?" : "Already an MXian?"}{" "}
          <button
            type="button"
            onClick={() => onNavigate(isLogin ? "signup" : "login")}
            className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
};


// --- Home Page Components ---

const HeroAnimation = () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0" aria-hidden="true">
        <BookOpen
            id="hero-central-note"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 text-gray-800/50 opacity-50"
            strokeWidth={1}
        />
        <BookOpen className="hero-shared-note hero-note-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-500 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-400 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 text-blue-500 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-400 opacity-0" strokeWidth={1.5} />
    </div>
);

// --- Replace HomePage component (starts around line 506) ---


// NOTE: This component assumes the following are defined globally:
// - LucideIcons, Button, Card, CardHeader, CardTitle, CardContent, Input, Select
// - mockNoteList, ToastContext, API_BASE_URL, fetchMiniMaxContent, NoteCard
// - gsap, ScrollTrigger, HeroAnimation

const HomePage = ({ onNavigate }) => {
  const { addToast } = useContext(ToastContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. Initial State: Use MOCK DATA to ensure component doesn't crash on initial render.
  const [allNotes, setAllNotes] = useState(mockNoteList); 
  const [topNotes, setTopNotes] = useState(mockNoteList.slice(0, 3)); 
  const [latestNotes, setLatestNotes] = useState(mockNoteList.slice(0, 3)); 
  const [searchResults, setSearchResults] = useState([]);

  // 2. Refs for GSAP animation targets
  const titleRef = useRef(null); 

  // --- Data Fetching and Sorting ---
  useEffect(() => {
    // This hook will calculate the sorted lists whenever the local 'allNotes' state changes.
    if (allNotes && allNotes.length > 0) {
      // Sort by rating (Note: assuming your mock data has 'rating' and 'date' keys)
      const sortedByRating = [...allNotes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setTopNotes(sortedByRating.slice(0, 3));

      const sortedByDate = [...allNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
      setLatestNotes(sortedByDate.slice(0, 3));
    }
  }, [allNotes]); 


  // --- Search Filtering Logic ---
  useEffect(() => {
    if (searchQuery === '') {
      setSearchResults([]);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const results = allNotes.filter(note => 
        note.title.toLowerCase().includes(lowerCaseQuery) ||
        note.subject.toLowerCase().includes(lowerCaseQuery) ||
        note.contributor.toLowerCase().includes(lowerCaseQuery)
      );
      setSearchResults(results);
    }
  }, [searchQuery, allNotes]);


  // --- GSAP Animation Setup ---
  useEffect(() => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger); 
        console.log("GSAP & ScrollTrigger registered. Running animations...");

        const title = titleRef.current; 
        
        if (title) { // Use ref to target the element safely
          title.style.transformStyle = 'preserve-3d';
          title.style.perspective = '1000px';
          title.addEventListener('mousemove', (e) => {
            const rect = title.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = -(y / rect.height - 0.5) * 10;
            const rotateY = (x / rect.width - 0.5) * 10;
            gsap.to(title, { rotationX: rotateX, rotationY: rotateY, scale: 1.02, duration: 0.5, ease: "power2.out" });
          });
          title.addEventListener('mouseleave', () => {
            gsap.to(title, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.3)" });
          });
        }
        
        const tl = gsap.timeline({ repeat: -1, delay: 1 });
        tl.fromTo(".hero-note-1", { x: 0, y: 0, opacity: 0, scale: 0.5, rotation: -30 }, { x: 220, y: -120, opacity: 1, scale: 1, rotation: 15, duration: 1.5, ease: "power2.out" }, "start")
          .to(".hero-note-1", { opacity: 0, duration: 1, ease: "power1.in" }, ">-0.5");
        tl.fromTo(".hero-note-2", { x: 0, y: 0, opacity: 0, scale: 0.5, rotation: 20 }, { x: -200, y: 130, opacity: 1, scale: 0.9, rotation: -10, duration: 1.5, ease: "power2.out" }, "start+=0.5")
          .to(".hero-note-2", { opacity: 0, duration: 1, ease: "power1.in" }, ">-0.5");
        tl.fromTo(".hero-note-3", { x: 0, y: 0, opacity: 0, scale: 0.5, rotation: -10 }, { x: -180, y: -90, opacity: 1, scale: 1.1, rotation: 5, duration: 1.5, ease: "power2.out" }, "start+=1.0")
          .to(".hero-note-3", { opacity: 0, duration: 1, ease: "power1.in" }, ">-0.5");
         tl.fromTo(".hero-note-4", { x: 0, y: 0, opacity: 0, scale: 0.5, rotation: 30 }, { x: 180, y: 100, opacity: 1, scale: 1, rotation: -5, duration: 1.5, ease: "power2.out" }, "start+=1.5")
          .to(".hero-note-4", { opacity: 0, duration: 1, ease: "power1.in" }, ">-0.5");

        // Scroll-Triggered Note Card Animation
        gsap.set(".home-note-card", { opacity: 0, y: 50 });
        ScrollTrigger.batch(".home-note-card", {
          start: "top 85%",
          onEnter: batch => gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
          }),
          once: true
        });

    } else {
        console.log("Note: GSAP / ScrollTrigger not detected. Making cards visible by default.");
        document.querySelectorAll('.home-note-card').forEach(card => {
            card.style.opacity = 1;
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans transition-colors duration-300">

      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Aperture className="w-7 h-7 text-blue-500" />
            <span className="text-xl font-bold text-white">MXShare</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => onNavigate('login')} className="hidden sm:inline-flex">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button onClick={() => onNavigate('signup')} size="default">
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden pt-16 hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950 to-gray-900 hero-bg"></div>
        <HeroAnimation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 text-center">
          <h1 
            className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white leading-tight mxshare-title cursor-pointer"
            ref={titleRef} // <-- Attach Ref
          >
            MXShare Notes
          </h1>
          <p className="mt-4 text-3xl text-blue-400 font-light">
            Collaborate. Share. Learn.
          </p>
          <div className="mt-10 max-w-lg mx-auto flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button onClick={() => onNavigate('login')} size="lg" className="flex-1 rounded-full">
              Login Now
            </Button>
            <Button onClick={() => onNavigate('signup')} size="lg" variant="outline" className="flex-1 rounded-full">
              Start Sharing
            </Button>
          </div>

          <div className="mt-12 w-full max-w-2xl mx-auto p-4 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-800 search-teaser">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes, subjects, or contributors..."
                className="w-full h-14 pl-12 pr-4 text-lg border border-gray-700 bg-gray-800 text-white rounded-xl focus:ring-2 focus-visible:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery === '' && (
              <p className="mt-2 text-sm text-gray-500">Intelligent platform for MCA students to find exactly what they need.</p>
            )}
          </div>
        </div>
      </div>

      <div className="py-20 lg:py-32 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
          {/* 4. Use searchResults state */}
          {searchQuery !== '' ? (
            <div className="mb-16">
              <h2 className="text-4xl font-extrabold text-white mb-8 text-center">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.length > 0 ? (
                <div className="note-card-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.map((note) => (
                    <div key={note.id} className="home-note-card">
                      <NoteCard note={note} onNavigate={onNavigate} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-lg">
                  No notes found matching your query.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* 5. Render Top Notes from state */}
              <div className="mb-16 note-card-container">
                <h2 className="text-4xl font-extrabold text-white mb-8 text-center">
                  Top Rated Notes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {topNotes.map((note) => (
                      <div key={note.id} className="home-note-card">
                        <NoteCard note={note} onNavigate={onNavigate} />
                      </div>
                  ))}
                </div>
              </div>

              {/* 6. Render Latest Notes from state */}
              <div className="note-card-container">
                <h2 className="text-4xl font-extrabold text-white mb-8 text-center">
                  Latest Notes
                </h2 >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {latestNotes.map((note) => (
                      <div key={note.id} className="home-note-card">
                        <NoteCard note={note} onNavigate={onNavigate} />
                      </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="bg-gray-900 border-t border-gray-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} MXShare. Collaborate. Share. Learn.</p>
        </div>
      </footer>
    </div>
  );
};


// ----------------------------------------------------------------------
// --- Dashboard Sub-Views (Themed for "loveable.ai" style) ---
// ----------------------------------------------------------------------

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
        <Button variant="outline" className="w-full">
            Edit Profile Details
        </Button>
    </div>
);

const DashboardResetPassword = ({ onReset }) => {
    // --- (No Change Needed) ---
    // This component correctly reads authToken from context
    // and sends it in the header.
    const { authToken } = useContext(AuthContext); 
    const [formData, setFormData] = useState({ current: '', newPass: '', confirmPass: '' });
    const [status, setStatus] = useState('');
    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

// --- Inside DashboardResetPassword component ---

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
                'Authorization': `Bearer ${authToken}` // <-- This is correct
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

// ----------------------------------------------------------------------
// --- Top Contributors Page (with Chart) ---
// ----------------------------------------------------------------------

const TopContributors = () => {
    const [sortBy, setSortBy] = useState('rating');
    const [sortedContributors, setSortedContributors] = useState(mockContributors);

    useEffect(() => {
        let sorted = [...mockContributors];
        if (sortBy === 'score') {
            sorted.sort((a, b) => b.score - a.score);
        } else if (sortBy === 'rating') {
            sorted.sort((a, b) => b.rating - a.rating);
        }
        setSortedContributors(sorted);
    }, [sortBy]);

    const handleSortChange = (newSortBy) => {
        console.log(`Simulating re-order animation for sort by: ${newSortBy}`);
        setSortBy(newSortBy);
    };

    const getRankCardStyle = (rank) => {
        switch (rank) {
            case 1: return 'bg-yellow-900/30 border-yellow-500 transform scale-105 shadow-xl shadow-yellow-900/30';
            case 2: return 'bg-gray-800/50 border-gray-600';
            case 3: return 'bg-orange-900/30 border-orange-600';
            default: return 'bg-gray-800';
        }
    };

    const TopRankCard = ({ contributor, rank }) => (
        <Card className={`text-center p-6 transition-transform duration-300 hover:scale-[1.03] ${getRankCardStyle(rank)}`}>
            <Award className={`w-8 h-8 mx-auto ${rank === 1 ? 'text-yellow-500 fill-yellow-400' : (rank === 2 ? 'text-gray-400 fill-gray-500' : 'text-orange-500 fill-orange-600')} mb-2`} />
            <p className="text-3xl font-extrabold text-white">{rank}</p>
            <h4 className="text-lg font-semibold mt-1 text-white">{contributor.name}</h4>
            <p className="text-sm text-gray-400">{contributor.department}</p>
        </Card>
    );

    const RankTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
                <thead>
                    <tr className="bg-gray-800/50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('rating')}>
                            Rating <TrendingUp className={`w-4 h-4 inline ml-1 ${sortBy === 'rating' ? 'text-blue-500' : 'text-gray-600'}`} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('score')}>
                            Score <TrendingUp className={`w-4 h-4 inline ml-1 ${sortBy === 'score' ? 'text-blue-500' : 'text-gray-600'}`} />
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {sortedContributors.map((c, index) => (
                        <tr key={c.id} className="hover:bg-gray-800/50 transition-colors duration-100">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" /> {c.rating}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-semibold">{c.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const LeaderboardChart = ({ data }) => {
        const chartData = data.slice(0, 5).map(user => ({ name: user.name.split(' ')[0], score: user.score })).reverse();
        return (
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="#9ca3af" fontSize={12} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} className="fill-blue-600" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-4xl font-extrabold text-white mb-8 flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-500" /> MXian Leaderboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {sortedContributors.slice(0, 3).map((c, index) => (
                    <TopRankCard key={c.id} contributor={c} rank={index + 1} />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-2">
                   <CardHeader>
                       <CardTitle>Top 5 Contributors (by Score)</CardTitle>
                   </CardHeader>
                   <CardContent>
                       <LeaderboardChart data={sortedContributors} />
                   </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Detailed Contributor Rankings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankTable />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- Note Detail / Review Page ---
// ----------------------------------------------------------------------

const RatingInput = ({ rating, setRating }) => {
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer transition-colors duration-150 ${
                        star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'
                    }`}
                    onClick={() => setRating(star)}
                />
            ))}
        </div>
    );
};

const NoteDetailPage = ({ note, onBack }) => {
    const { addToast } = useContext(ToastContext);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [review, setReview] = useState({ rating: 0, comment: '' });
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    
    const [reviews, setReviews] = useState([]);

    // --- (No Change Needed) ---
    // This component correctly reads authToken from context
    // and sends it in the header.
    const { user, authToken } = useContext(AuthContext);

    useEffect(() => {
      if (note?._id) { 
        fetch(`${API_BASE_URL}/api/notes/${note._id}/reviews`, {
            headers: {
                'Authorization': `Bearer ${authToken}` // <-- This is correct
            }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setReviews(data);
            }
          })
          .catch(err => addToast('Failed to load reviews.', 'error'));
      }
    }, [note?._id, addToast, authToken]);

    const handleDownload = () => {
        addToast(`Simulating download for "${note.title}". Access granted!`, 'success');
        setHasDownloaded(true);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (review.rating === 0) {
            addToast('Please provide a star rating.', 'error');
            return;
        }
        setIsReviewSubmitting(true);
        addToast('Submitting review...', 'info');

        try {
          const res = await fetch(`${API_BASE_URL}/api/notes/${note._id}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // <-- This is correct
            },
            body: JSON.stringify({
              rating: review.rating,
              comment: review.comment
            })
          });

          const newReviewData = await res.json();

          if (res.ok) {
            addToast('Review submitted successfully!', 'success');
            setReviews(prev => [newReviewData, ...prev]);
            setReview({ rating: 0, comment: '' });
          } else {
            addToast(newReviewData.message || 'Failed to submit review.', 'error');
          }
        } catch (err) {
          addToast('Network error submitting review.', 'error');
        } finally {
          setIsReviewSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ... (Back button, Title, Preview) ... */}
            
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 space-y-3">
                    <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-3">Note Details</h3>
                    <p className="flex items-center text-sm text-gray-300">
                        <User className="w-4 h-4 mr-3 text-blue-500" />
                        <span className="font-semibold">Contributor:</span> {note.uploader ? note.uploader.name : '...'}
                    </p>
                    <p className="flex items-center text-sm text-gray-300">
                        <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                        <span className="font-semibold">Uploaded:</span> {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                    <p className="flex items-center text-sm text-gray-300">
                        <Eye className="w-4 h-4 mr-3 text-blue-500" />
                        <span className="font-semibold">Downloads:</span> {note.downloads}
                    </p>
                    <p className="flex items-center text-sm text-gray-300">
                        <Star className="w-4 h-4 mr-3 text-yellow-500" />
                        <span className="font-semibold">Avg Rating:</span> {note.avgRating.toFixed(1)} ({note.reviewCount} Reviews)
                    </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 space-y-4">
                    {/* ... (Review form is fine) ... */}

                    <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">
                        {reviews.map(r => (
                            <div key={r._id} className="border-b border-gray-700 pb-2">
                                <div className="flex items-center justify-between text-xs">
                                    <p className="font-semibold text-gray-200">{r.user ? r.user.name : '...'}</p>
                                    <div className="flex items-center">
                                        <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                                        <span className="text-gray-400">{r.rating}.0</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">{r.comment}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// --- File Upload Component (Integrated Google Drive Logic) ---
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// --- File Upload Component (Integrated Google Drive Logic) ---
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// --- File Upload Component (With Tags & Video Support) ---
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// --- File Upload Component (Updated Heights) ---
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// --- File Upload Component (Fixed loginToDrive) ---
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// --- File Upload Component (Fixed) ---
// ----------------------------------------------------------------------
const FileUploadCard = ({ onFileUploadSuccess }) => {
  const { addToast } = useContext(ToastContext);
  const { authToken } = useContext(AuthContext);

  // Modes: 'selection', 'file-preview', 'video-entry'
  const [mode, setMode] = useState('selection'); 
  
  // Data States
  const [selectedFile, setSelectedFile] = useState(null); 
  const [videoUrl, setVideoUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tag States
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // --- Helper: Reset ---
  const resetForm = () => {
    setMode('selection');
    setSelectedFile(null);
    setVideoUrl('');
    setCustomTitle('');
    setSubject('');
    setSemester('');
    setTags([]);     
    setTagInput(''); 
  };

  // --- Helper: Video Embed ---
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // --- Tag Handlers ---
  const handleAddTag = (e) => {
    e?.preventDefault();
    const trimmed = tagInput.trim();
    
    if (!trimmed) return;
    
    if (tags.includes(trimmed)) {
        addToast("Tag already added.", "error");
        return;
    }
    
    if (tags.length >= 5) {
        addToast("Maximum 5 tags allowed.", "error");
        return;
    }

    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
    }
  };

  // --- Google Picker Logic ---
  const loadPickerApi = () => {
    return new Promise((resolve) => {
      if (window.google && window.google.picker) { resolve(); } 
      else {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => window.gapi.load("picker", resolve);
        document.body.appendChild(script);
      }
    });
  };

  const createPicker = (accessToken) => {
    const pickerCallback = (data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        setSelectedFile({
          id: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
          iconUrl: doc.iconUrl,
          accessToken: accessToken
        });
        setCustomTitle(doc.name); 
        setMode('file-preview');
      }
    };

    const developerKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const appId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const uploadView = new window.google.picker.DocsUploadView();
    const driveView = new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .addView(uploadView)
      .addView(driveView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(developerKey)
      .setAppId(appId)
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  };

  // --- THIS WAS MISSING IN YOUR CODE ---
  const loginToDrive = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await loadPickerApi();
      createPicker(tokenResponse.access_token);
    },
    scope: "https://www.googleapis.com/auth/drive.file",
    onError: () => addToast("Failed to authorize Google Drive", "error"),
  });
  // -------------------------------------

  // --- Submission Logic ---
  const handleSubmit = async () => {
    if (!customTitle || !subject || !semester) {
      addToast("Please fill in Title, Subject, and Semester.", "error");
      return;
    }
    
    if (mode === 'video-entry' && !videoUrl) {
        addToast("Please enter a valid Video URL.", "error");
        return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: customTitle,
        subject,
        semester,
        videoUrl: videoUrl,
        tags: tags,
        ...(mode === 'file-preview' && selectedFile ? {
            fileId: selectedFile.id,
            mimeType: selectedFile.mimeType,
            iconUrl: selectedFile.iconUrl,
            googleToken: selectedFile.accessToken
        } : {})
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/notes/save-drive-reference`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (res.data) {
        addToast("Material published successfully!", "success");
        if (onFileUploadSuccess) onFileUploadSuccess(res.data.note);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to save.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- RENDER ----------------

  // 1. SELECTION SCREEN
  if (mode === 'selection') {
    return (
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800 h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Share Material</h2>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => loginToDrive()} 
                    className="flex flex-col items-center justify-center p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all hover:-translate-y-1 group"
                >
                    <div className="w-14 h-14 bg-blue-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                        <FileText className="w-7 h-7 text-blue-400 group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-gray-200">Document / File</span>
                    <span className="text-xs text-gray-500 mt-1">PDF, PPT, DOCX</span>
                </button>

                <button 
                    onClick={() => setMode('video-entry')}
                    className="flex flex-col items-center justify-center p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all hover:-translate-y-1 group"
                >
                    <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-600 transition-colors">
                        <PlayCircle className="w-7 h-7 text-red-400 group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-gray-200">Video Link</span>
                    <span className="text-xs text-gray-500 mt-1">YouTube, Vimeo</span>
                </button>
            </div>
        </div>
    );
  }

  // 2. DETAILS FORM
  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-800 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
        <h3 className="text-xl font-bold text-white">
            {mode === 'file-preview' ? 'File Details' : 'Video Details'}
        </h3>
        <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      {/* PREVIEW SECTION */}
      <div className="mb-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        
        {/* --- FILE PREVIEW --- */}
        {mode === 'file-preview' && selectedFile && (
            <>
                <div className="p-2 bg-gray-900 border-b border-gray-700 flex items-center">
                    <img src={selectedFile.iconUrl} alt="" className="w-4 h-4 mr-2" />
                    <span className="text-sm text-white truncate">{selectedFile.name}</span>
                </div>
                <div className="relative w-full h-[600px] bg-gray-950 flex items-center justify-center">
                    <iframe 
                        src={`https://drive.google.com/file/d/${selectedFile.id}/preview`} 
                        className="w-full h-full" 
                        title="File Preview"
                    ></iframe>
                </div>
            </>
        )}

        {/* --- VIDEO PREVIEW --- */}
        {mode === 'video-entry' && (
            <div className="p-4 space-y-3">
                <Input 
                    label="Paste Video URL" 
                    id="vidUrl" 
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)} 
                />
                {getYoutubeEmbed(videoUrl) ? (
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe 
                            src={getYoutubeEmbed(videoUrl)} 
                            className="w-full h-full" 
                            title="Video Preview" 
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : (
                    <div className="w-full h-24 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500 text-sm border border-gray-700 border-dashed">
                        Video preview will appear here
                    </div>
                )}
            </div>
        )}
      </div>

      {/* COMMON FIELDS */}
      <div className="space-y-4">
        <Input 
            label="Title" 
            id="customTitle" 
            value={customTitle} 
            onChange={(e) => setCustomTitle(e.target.value)} 
            placeholder="e.g. Intro to Data Structures"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Semester" id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} required>
            <option value="">Select Semester...</option>
            {syllabusData.semesters.map(sem => (<option key={sem.value} value={sem.value}>{sem.name}</option>))}
            </Select>

            <Select label="Subject" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required>
            <option value="">Select Subject...</option>
            {syllabusData.subjects.map(subj => (<option key={subj} value={subj}>{subj}</option>))}
            </Select>
        </div>

        {/* TAGS SECTION */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Tags (Optional)</label>
            <div className="flex space-x-2">
                <input 
                    className="flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Type tag & press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                />
                <Button type="button" variant="secondary" onClick={handleAddTag}>Add</Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2 min-h-[24px]">
                {tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-800">
                        {tag}
                        <button 
                            type="button" 
                            onClick={() => handleRemoveTag(tag)} 
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-800 hover:text-white focus:outline-none"
                        >
                            <span className="sr-only">Remove tag</span>
                            &times;
                        </button>
                    </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-gray-500 italic">No tags added yet.</span>}
            </div>
        </div>

        <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full mt-4 text-lg h-12"
        >
            {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Publishing...</> : <><Send className="mr-2" /> Post Material</>}
        </Button>
      </div>
    </div>
  );
};
  




// ----------------------------------------------------------------------
// --- Main Dashboard Component ---
// ----------------------------------------------------------------------
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
        // Since the actual note is added by the Socket.IO listener in App.jsx, 
        // this function primarily remains to trigger the process and show the toast.
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
                            {/* ... (All Community Notes rendering) ... */}
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
                        <div
                            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-blue-900/50 transition-shadow duration-200"
                            title="Open Menu"
                        >
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
                                    <LucideIcons.LogOut className="w-4 h-4 mr-3" />
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


// ----------------------------------------------------------------------
// --- Protected Route & Wrappers (Unchanged) ---
// ----------------------------------------------------------------------


const NoteDetailWrapper = () => {
  const { state } = useLocation(); 
  if (!state || !state.note) {
    return <Navigate to="/dashboard" replace />;
  }
  return <NoteDetailPage note={state.note} />;
};

// ----------------------------------------------------------------------
// --- Google Auth Callback (FIXED) ---
// ----------------------------------------------------------------------
const GoogleAuthCallback = () => {
  const { onAuthSuccess } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      const errorMsg = searchParams.get("error") || "Authentication cancelled.";
      if (!handledRef.current) {
        handledRef.current = true;
        addToast(`Google login error: ${errorMsg}`, "error");
      }
      navigate("/login");
      return;
    }

    if (handledRef.current) return;
    handledRef.current = true;

    fetch("http://localhost:3001/api/auth/google/callback", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code }),
})
.then(async (res) => {
  const data = await res.json();

  onAuthSuccess(
  data.accessToken,
  data.user,
  data.refreshToken,
  data.googleAccessToken,
  data.googleRefreshToken
);


  navigate("/dashboard");
})



      .catch((err) => {
        console.error("Error in GoogleAuthCallback:", err);
        addToast(`Login failed: ${err.message}`, "error");
        navigate("/login");
      });
  }, [searchParams, onAuthSuccess, navigate, addToast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <h2 className="mt-4 text-xl font-semibold text-white">Completing login...</h2>
    </div>
  );
};



// ----------------------------------------------------------------------
// --- Main App Component (FIXED) ---
// ----------------------------------------------------------------------
const App = () => {
// --- All useState hooks here ---
const [authToken, setAuthToken] = useState(null);
const [authChecked, setAuthChecked] = useState(false);
const [currentDashboardView, setCurrentDashboardView] = useState('main'); 
const [allNotes, setAllNotes] = useState([]);
const [user, setUser] = useState(null);
const [googleAccessToken, setGoogleAccessToken] = useState(null);
const [googleRefreshToken, setGoogleRefreshToken] = useState(null);
const [refreshToken, setRefreshToken] = useState(null);


useEffect(() => {
  const gToken = localStorage.getItem("googleAccessToken");
  if (gToken) setGoogleAccessToken(gToken);
}, []);


// --- FIX: ProtectedRoute placed AFTER state initialization ---
const ProtectedRoute = ({ children }) => {
  if (!authChecked) return null;        // wait for JWT validation
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

useEffect(() => {
  const jwt = localStorage.getItem("authToken");
  if (jwt) setAuthToken(jwt);

  const gToken = localStorage.getItem("googleAccessToken");
  if (gToken) setGoogleAccessToken(gToken);
}, []);


  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);

  const onNavigate = (path) => navigate(`/${path}`);

  const onDashboardViewChange = (view) => {
    setCurrentDashboardView(view);
    navigate('/dashboard'); 
  };


  // --- MODIFIED --- (Change 2 & 4)
  // Updated onAuthSuccess to store tokens in localStorage
const onAuthSuccess = (
  accessToken,
  user,
  refreshToken,
  googleAccessToken,
  googleRefreshToken
) => {

  setAuthToken(accessToken);
  setUser(user);
  setRefreshToken(refreshToken);

  setGoogleAccessToken(googleAccessToken || null);
  setGoogleRefreshToken(googleRefreshToken || null);

  localStorage.setItem("authToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  if (googleAccessToken)
    localStorage.setItem("googleAccessToken", googleAccessToken);

  if (googleRefreshToken)
    localStorage.setItem("googleRefreshToken", googleRefreshToken);
};



  // --- MODIFIED --- (Change 5)
  // Updated onLogout to clear storage and POST refresh token
  const onLogout = () => {
  const token = localStorage.getItem("authToken");

  fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  }).finally(() => {
    localStorage.clear();
    setUser(null);
    setAuthToken(null);
    // navigate *AFTER* state resets
    navigate("/login");
  });
};



  // --- MODIFIED --- (Change 4)
  // New function to handle token refresh
  const refreshAccessToken = async () => {
    const rToken = localStorage.getItem('refreshToken');
    if (!rToken) {
       onLogout(); // This clears state and storage
       return false; // Return failure
    }
    try {
       const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { 
         refreshToken: rToken 
       });
       
       // Refresh succeeded, save new tokens
       const { accessToken, refreshToken } = res.data;
       localStorage.setItem('authToken', accessToken);
       localStorage.setItem('refreshToken', refreshToken);
       
       // Manually set state token
       setAuthToken(accessToken);
       return accessToken; // Return new token
    } catch (err) {
       onLogout(); // Refresh failed, log out
       return false; // Return failure
    }
  };


  // --- MODIFIED --- (Change 1 & 4)
  // Replaced session-check useEffect with new JWT flow
  // --- Rewritten checkSession (use returned tokens correctly) ---
useEffect(() => {
  let mounted = true;

  const checkSession = async () => {
    const token = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // --- Case 1: No tokens at all ---
    if (!token && !refreshToken) {
      if (mounted) {
        setUser(null);
        setAuthChecked(true);
      }
      return;
    }

    // --- Case 2: We have access token: test it ---
    if (token) {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
        if (mounted) {
          setUser(res.data.user);
          setAuthChecked(true);
        }
        return;
      } catch (err) {
        // token expired → try refresh
      }
    }

    // --- Case 3: try to refresh ---
    const newToken = await refreshAccessToken();
    if (newToken) {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
        if (mounted) {
          setUser(res.data.user);
          setAuthChecked(true);
        }
        return;
      } catch (err) {
        onLogout();
      }
    }

    // refresh failed
    if (mounted) {
      setUser(null);
      setAuthChecked(true);
    }
  };

  checkSession();
  return () => (mounted = false);
}, []);     // <---- CRITICAL: MUST BE EMPTY




  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // --- FIXED: Only ONE return block ---
return (

  <AuthContext.Provider value={{
  user,
  authToken,
  refreshToken,
  googleAccessToken,
  googleRefreshToken,

  setUser,
  setAuthToken,
  setRefreshToken,
  setGoogleAccessToken,
  setGoogleRefreshToken,

  onAuthSuccess   // <-- ADD THIS
}}>


      <Routes>
        
        <Route 
          path="/" 
          element={<HomePage onNavigate={onNavigate} />} 
        />
        <Route 
          path="/login" 
          element={<AuthForm type="Login" onNavigate={onNavigate} onAuthSuccess={onAuthSuccess} />} 
        />
        <Route 
          path="/signup" 
          element={<AuthForm type="Signup" onNavigate={onNavigate} onAuthSuccess={onAuthSuccess} />} 
        />
        <Route 
          path="/auth/google/callback" 
          element={<GoogleAuthCallback />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard
                user={user}
                onLogout={onLogout}
                allNotes={allNotes}
                setAllNotes={setAllNotes}
                currentView={currentDashboardView}
                onDashboardViewChange={onDashboardViewChange}
              />
            </ProtectedRoute>
          }
        />

        {/* Note Detail */}
        <Route 
          path="/note/detail" 
          element={
            <ProtectedRoute>
              <UserDashboard
                user={user}
                onLogout={onLogout}
                allNotes={allNotes}
                setAllNotes={setAllNotes}
                currentView={currentDashboardView}
                onDashboardViewChange={onDashboardViewChange}
              >
                <NoteDetailWrapper />
              </UserDashboard>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthContext.Provider>
  );
};


// --- Main App Wrapper ---
const AppWrapper = () => (
  
  <GoogleOAuthProvider 
    clientId={GOOGLE_CLIENT_ID}
    scope="email profile openid https://www.googleapis.com/auth/drive.file"
  >
    <BrowserRouter>
      <NotificationProvider> 
        <App /> 
      </NotificationProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);

// CRITICAL: REACT DOM MOUNTING LOGIC
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
            <AppWrapper />
    );
}