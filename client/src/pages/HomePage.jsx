import React, { useState, useEffect, useRef, useContext } from 'react';
import { Aperture, Search, LogIn, UserPlus, BookOpen } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import your custom components and data
import { Button } from '../components/ui/primitives';
import NoteCard from '../components/NoteCard';
import { ToastContext } from '../context/ToastContext';
import { mockNoteList } from '../data/constants';

const HeroAnimation = () => (
    // Background icons are now light gray
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0" aria-hidden="true">
        <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 text-gray-200/50 opacity-50" strokeWidth={1} />
        <BookOpen className="hero-shared-note hero-note-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-500 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-400 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 text-blue-500 opacity-0" strokeWidth={1.5} />
        <BookOpen className="hero-shared-note hero-note-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-400 opacity-0" strokeWidth={1.5} />
    </div>
);

const HomePage = ({ onNavigate }) => {
  const { addToast } = useContext(ToastContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [allNotes, setAllNotes] = useState(mockNoteList); 
  const [topNotes, setTopNotes] = useState(mockNoteList.slice(0, 3)); 
  const [latestNotes, setLatestNotes] = useState(mockNoteList.slice(0, 3)); 
  const [searchResults, setSearchResults] = useState([]);
  const titleRef = useRef(null); 

  // Sort Data
  useEffect(() => {
    if (allNotes && allNotes.length > 0) {
      const sortedByRating = [...allNotes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setTopNotes(sortedByRating.slice(0, 3));
      const sortedByDate = [...allNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
      setLatestNotes(sortedByDate.slice(0, 3));
    }
  }, [allNotes]); 

  // Search Logic
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

  // Animations
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
    // Main background is white, text is dark gray
    <div className="min-h-screen bg-white text-gray-900 font-sans transition-colors duration-300">
      
      {/* Header: White background, light gray border */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Aperture className="w-7 h-7 text-blue-500" />
            <span className="text-xl font-bold text-gray-900">MXShare</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => onNavigate('login')} className="hidden sm:inline-flex text-gray-700 hover:text-blue-500">
              <LogIn className="w-4 h-4 mr-2" /> Login
            </Button>
            <Button onClick={() => onNavigate('signup')} size="default">
              <UserPlus className="w-4 h-4 mr-2" /> Sign Up
            </Button>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden pt-16 hero-section">
        {/* Hero Background: changed to solid white or light gradient */}
        <div className="absolute inset-0 bg-white hero-bg"></div>
        <HeroAnimation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 text-center">
          {/* Text is dark */}
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight mxshare-title cursor-pointer" ref={titleRef}>
            MXShare Notes
          </h1>
          <p className="mt-4 text-3xl text-blue-600 font-light">Collaborate. Share. Learn.</p>
          <div className="mt-10 max-w-lg mx-auto flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button onClick={() => onNavigate('login')} size="lg" className="flex-1 rounded-full">Login Now</Button>
            <Button onClick={() => onNavigate('signup')} size="lg" variant="outline" className="flex-1 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50">Start Sharing</Button>
          </div>

          {/* Search Box: White background, light border */}
          <div className="mt-12 w-full max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-xl border border-gray-300 search-teaser">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search notes, subjects, or contributors..."
                // Input is white/light gray background, dark text
                className="w-full h-14 pl-12 pr-4 text-lg border border-gray-300 bg-gray-50 text-gray-900 rounded-xl focus:ring-2 focus-visible:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchQuery !== '' ? (
            <div className="mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Search Results ({searchResults.length})</h2>
              {searchResults.length > 0 ? (
                <div className="note-card-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.map((note) => (
                    <div key={note.id} className="home-note-card">
                      <NoteCard note={note} onNavigate={onNavigate} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 text-lg">No notes found matching your query.</p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-16 note-card-container">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Top Rated Notes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {topNotes.map((note) => (
                      <div key={note.id} className="home-note-card">
                        <NoteCard note={note} onNavigate={onNavigate} />
                      </div>
                  ))}
                </div>
              </div>

              <div className="note-card-container">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Latest Notes</h2 >
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

      {/* Footer: Light gray background, light border */}
      <footer className="bg-gray-100 border-t border-gray-300 text-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">&copy; {new Date().getFullYear()} MXShare. Collaborate. Share. Learn.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;