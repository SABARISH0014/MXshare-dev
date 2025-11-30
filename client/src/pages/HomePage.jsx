import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Aperture, Search, LogIn, UserPlus, BookOpen, 
  Code, Database, Cpu, Globe, Calculator, Palette, Layers,
  Loader2, Sparkles // Added Sparkles for AI branding
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 

// Import your custom components and data
import { Button } from '../components/ui/primitives';
import NoteCard from '../components/NoteCard';
import ThemeToggle from '../components/ThemeToggle';
import TopContributors from '../components/TopContributors'; 
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../data/constants';

// --- ANIMATION COMPONENTS ---
const HeroAnimation = () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none" aria-hidden="true">
        <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 text-gray-200 dark:text-slate-800 opacity-50 dark:opacity-20 transition-colors duration-300" strokeWidth={1} />
        <BookOpen className="hero-shared-note hero-note-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-500 dark:text-blue-400 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-400 dark:text-indigo-400 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 text-blue-500 dark:text-cyan-400 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-400 dark:text-sky-400 opacity-0" strokeWidth={1.5} />
    </div>
);

const HomePage = ({ onNavigate }) => {
  const { addToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [allNotes, setAllNotes] = useState([]); 
  const [topNotes, setTopNotes] = useState([]); 
  const [latestNotes, setLatestNotes] = useState([]); 
  const [topContributors, setTopContributors] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Feature State
  const [useAI, setUseAI] = useState(false); 
  const [isSearching, setIsSearching] = useState(false); // Separate loading state for search
  
  const titleRef = useRef(null); 

  // --- LOGIC: FETCH LIVE DATA ---
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/notes`);
        setAllNotes(res.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
        addToast("Failed to load latest notes", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [addToast]);

  // --- LOGIC: PROCESS DATA (Sort & Filter) ---
  useEffect(() => {
    if (allNotes && allNotes.length > 0) {
      // 1. Sort Top Rated
      const sortedByRating = [...allNotes].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      setTopNotes(sortedByRating.slice(0, 3));

      // 2. Sort Latest
      const sortedByDate = [...allNotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLatestNotes(sortedByDate.slice(0, 3));

      // 3. Calculate Top Contributors
      const contributorMap = {};
      allNotes.forEach(note => {
        const contributorName = note.uploader?.name || "Unknown User";
        
        if (!contributorMap[contributorName]) {
            contributorMap[contributorName] = {
                id: contributorName.replace(/\s+/g, '-').toLowerCase(),
                name: contributorName,
                uploads: 0,
                avatar: `https://ui-avatars.com/api/?name=${contributorName}&background=random`
            };
        }
        contributorMap[contributorName].uploads += 1;
      });

      const sortedContributors = Object.values(contributorMap)
        .sort((a, b) => b.uploads - a.uploads)
        .slice(0, 5); 
      
      setTopContributors(sortedContributors);
    }
  }, [allNotes]); 

  // --- LOGIC: HANDLE NOTE CLICK ---
  const handleViewNote = (note) => {
    if (user) {
        navigate(`/note/${note._id}`, { state: { from: '/' } }); 
    } else {
        addToast("Please login to view note details", "info");
        navigate('/login', { state: { from: `/note/${note._id}` } });
    }
  };

  // --- CATEGORIES CONFIG ---
  const categories = [
    { name: 'Computer Science', icon: <Code className="w-5 h-5" /> },
    { name: 'Mathematics', icon: <Calculator className="w-5 h-5" /> },
    { name: 'Web Dev', icon: <Globe className="w-5 h-5" /> },
    { name: 'Database', icon: <Database className="w-5 h-5" /> },
    { name: 'Electronics', icon: <Cpu className="w-5 h-5" /> },
    { name: 'Design', icon: <Palette className="w-5 h-5" /> },
  ];

  // --- UPDATED SEARCH LOGIC (AI + Standard) ---
  useEffect(() => {
    const runSearch = async () => {
      // If query is empty, clear results and stop
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        if (useAI) {
            // 1. AI SEMANTIC SEARCH (Server-side Embedding)
            const res = await axios.get(`${API_BASE_URL}/api/notes`, {
                params: { q: searchQuery, type: 'semantic' }
            });
            setSearchResults(res.data);
        } else {
            // 2. STANDARD KEYWORD SEARCH (Client-side filtering)
            const lowerCaseQuery = searchQuery.toLowerCase();
            const results = allNotes.filter(note => 
              note.title?.toLowerCase().includes(lowerCaseQuery) ||
              note.subject?.toLowerCase().includes(lowerCaseQuery) ||
              note.uploader?.name?.toLowerCase().includes(lowerCaseQuery) ||
              (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
            );
            setSearchResults(results);
        }
      } catch (e) {
        console.error("Search failed", e);
        addToast("Search encountered an error.", "error");
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search
    const timer = setTimeout(runSearch, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, useAI, allNotes, addToast]);

  // --- GSAP ANIMATIONS ---
  useEffect(() => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger); 
        
        const title = titleRef.current; 
        if (title) { 
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

        gsap.set(".home-note-card", { opacity: 0, y: 50 });
        ScrollTrigger.batch(".home-note-card", {
          start: "top 85%",
          onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }),
          once: true
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {setSearchQuery(''); window.scrollTo(0,0);}}>
            <Aperture className="w-7 h-7 text-blue-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">MXShare</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
                 <Button onClick={() => navigate('/dashboard')} size="sm" className="bg-blue-600 text-white">
                    Dashboard
                 </Button>
            ) : (
                <>
                <Button variant="ghost" onClick={() => onNavigate('login')} className="hidden sm:inline-flex text-gray-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-white">
                    <LogIn className="w-4 h-4 mr-2" /> Login
                </Button>
                <Button onClick={() => onNavigate('signup')} size="default" className="text-white dark:text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500">
                    <UserPlus className="w-4 h-4 mr-2" /> Sign Up
                </Button>
                </>
            )}
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden pt-16 hero-section">
        <div className="absolute inset-0 bg-white dark:bg-slate-950 transition-colors duration-300 hero-bg"></div>
        <HeroAnimation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 text-center">
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mxshare-title cursor-pointer transition-colors duration-300" ref={titleRef}>
            MXShare Notes
          </h1>
          <p className="mt-4 text-3xl text-blue-600 dark:text-blue-400 font-light">Collaborate. Share. Learn.</p>
          
          <div className="mt-8 max-w-lg mx-auto flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button onClick={() => user ? navigate('/dashboard') : onNavigate('login')} size="lg" className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 border-none shadow-lg shadow-blue-500/30">
                {user ? "Go to Dashboard" : "Login Now"}
            </Button>
            <Button onClick={() => user ? navigate('/dashboard') : onNavigate('signup')} size="lg" variant="outline" className="flex-1 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-slate-800 dark:hover:text-blue-300 bg-transparent">
                Start Sharing
            </Button>
          </div>

          {/* --- SEARCH BOX WITH AI TOGGLE --- */}
          <div className="mt-12 w-full max-w-2xl mx-auto p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-300 dark:border-slate-700 search-teaser transition-colors duration-300">
            <div className="relative flex items-center">
              {isSearching ? (
                  <Loader2 className="absolute left-4 w-5 h-5 animate-spin text-indigo-500" />
              ) : (
                  <Search className={`absolute left-4 w-5 h-5 ${useAI ? 'text-indigo-500' : 'text-gray-500 dark:text-slate-400'}`} />
              )}
              
              <input
                type="text"
                placeholder={useAI ? "Ask AI (e.g., 'Notes on thermodynamics equations')..." : "Search notes, subjects, or contributors..."}
                className="w-full h-14 pl-12 pr-28 text-lg border-none bg-transparent text-gray-900 dark:text-white focus:ring-0 placeholder:text-gray-500 dark:placeholder:text-slate-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* AI Toggle Switch */}
              <div 
                className="absolute right-4 flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setUseAI(!useAI)}
                title={useAI ? "Switch to Standard Search" : "Enable AI Semantic Search"}
              >
                <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${useAI ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <Sparkles className="w-3 h-3" />
                    <span>AI</span>
                </div>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${useAI ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${useAI ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- FEATURE: CATEGORY PILLS --- */}
      <div className="py-8 border-b border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 text-center sm:text-left">Browse by Subject</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            {categories.map((cat) => (
                <button 
                    key={cat.name} 
                    onClick={() => { setSearchQuery(cat.name); setUseAI(false); window.scrollTo({top: 400, behavior: 'smooth'}); }} 
                    className="group flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                <span className="text-gray-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{cat.icon}</span>
                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{cat.name}</span>
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="py-16 bg-white dark:bg-slate-950 transition-colors duration-300 min-h-[600px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading resources...</p>
            </div>
          ) : searchQuery !== '' ? (
            /* --- SEARCH RESULTS --- */
            <div className="mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                {useAI ? <Sparkles className="text-indigo-500 w-6 h-6" /> : <Search className="w-6 h-6" />}
                {useAI ? 'Semantic Results' : 'Search Results'}
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                  Found {searchResults.length} matches for "{searchQuery}"
              </p>

              {searchResults.length > 0 ? (
                <div className="note-card-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.map((note) => (
                    <div key={note._id} className="home-note-card">
                      <NoteCard note={note} onNavigate={() => handleViewNote(note)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                    <Layers className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-400 text-lg">No notes found matching "{searchQuery}".</p>
                    {useAI && <p className="text-sm text-indigo-500 mt-2">Try rephrasing your question or switching off AI mode.</p>}
                    <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-blue-600">Clear Search</Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* --- TOP RATED NOTES --- */}
              <div className="mb-24 note-card-container">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Top Rated Notes</h2>
                    <Button variant="link" onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400">View All</Button>
                </div>
                {topNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {topNotes.map((note) => (
                        <div key={note._id} className="home-note-card">
                            <NoteCard note={note} onNavigate={() => handleViewNote(note)} />
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No ratings yet. Be the first to rate!</p>
                )}
              </div>

              {/* --- FEATURE: TOP CONTRIBUTORS --- */}
              <div className="mb-24">
                  <TopContributors contributors={topContributors} />
              </div>

              {/* --- LATEST NOTES --- */}
              <div className="note-card-container mb-20">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Fresh Uploads</h2>
                    <Button variant="link" onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400">View All</Button>
                </div>
                {latestNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latestNotes.map((note) => (
                        <div key={note._id} className="home-note-card">
                            <NoteCard note={note} onNavigate={() => handleViewNote(note)} />
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No uploads yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- STATS STRIP --- */}
      <div className="py-16 bg-blue-600 dark:bg-blue-900 relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-500/50">
            {[
                { label: 'Active Students', value: '500+' },
                { label: 'Notes Shared', value: `${allNotes.length > 0 ? allNotes.length : '100'}+` },
                { label: 'Subjects', value: '45' },
                { label: 'Downloads', value: '5k+' }
            ].map((stat, i) => (
                <div key={i} className="p-4">
                <div className="text-4xl md:text-5xl font-extrabold mb-2 text-white">{stat.value}</div>
                <div className="text-blue-100 font-medium text-sm uppercase tracking-wide">{stat.label}</div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
             <Aperture className="w-6 h-6 text-blue-500" />
             <span className="font-bold text-lg">MXShare</span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-500 dark:text-slate-400">
              <a href="#" className="hover:text-blue-500">Privacy Policy</a>
              <a href="#" className="hover:text-blue-500">Terms of Service</a>
              <a href="#" className="hover:text-blue-500">Contact Support</a>
          </div>
          <p className="mt-4 md:mt-0 text-sm text-gray-500 dark:text-slate-500">&copy; {new Date().getFullYear()} MXShare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;