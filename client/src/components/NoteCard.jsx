import React, { useRef, useEffect } from 'react';
import { Star, Clock, User, ArrowRight, BookOpen } from 'lucide-react';
import { gsap } from 'gsap';
import { Button } from './ui/primitives';

const NoteCard = ({ note, onNavigate }) => {
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;
    const glow = glowRef.current;

    if (!card || !content || !glow) return;

    // 3D Tilt Logic
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; 
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 1000,
        transformStyle: "preserve-3d"
      });

      // Move content slightly more for parallax
      gsap.to(content, {
        x: (x - centerX) * 0.05,
        y: (y - centerY) * 0.05,
        duration: 0.4
      });

      // Glow follows mouse
      gsap.to(glow, {
        x: x,
        y: y,
        opacity: 0.6,
        duration: 0.2
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, { rotationX: 0, rotationY: 0, ease: "elastic.out(1, 0.5)", duration: 0.8 });
      gsap.to(content, { x: 0, y: 0, duration: 0.5 });
      gsap.to(glow, { opacity: 0, duration: 0.5 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative w-full h-full group perspective-1000"
    >
      {/* Card Base */}
      <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 data-[theme=dim]:bg-slate-800/80">
        
        {/* Dynamic Glow Effect */}
        <div 
          ref={glowRef}
          className="absolute w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 mix-blend-screen" 
        />

        {/* Content Container (Parallax) */}
        <div ref={contentRef} className="p-6 h-full flex flex-col relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{note.avgRating ? note.avgRating.toFixed(1) : "N/A"}</span>
            </div>
          </div>
          

          {/* Title & Subject */}
<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-500 transition-colors">
  {note.title}
</h3>
<p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
  {note.subject}
</p>

{/* Moderation Status Badge */}
{note.moderationStatus && (
  <div
    className={`
      inline-flex items-center gap-1 px-2.5 py-1 mb-3 rounded-full text-[11px]
      font-semibold tracking-wide shadow-sm backdrop-blur-lg border 
      transition-all duration-300
      ${
        note.moderationStatus === "safe"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        : note.moderationStatus === "blocked"
          ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
        : note.moderationStatus === "processing"
          ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-600 dark:text-yellow-400 animate-pulse"
        : "bg-gray-500/10 border-gray-500/20 text-gray-600"
      }
    `}
  >
    {/* Icon */}
    <span className="relative flex items-center justify-center w-3 h-3">
      <span
        className={`absolute w-2 h-2 rounded-full
          ${
            note.moderationStatus === "safe"
              ? "bg-emerald-500"
            : note.moderationStatus === "blocked"
              ? "bg-red-500"
            : note.moderationStatus === "processing"
              ? "bg-yellow-400 animate-ping"
            : "bg-gray-400"
          }`}
      />
    </span>

    {note.moderationStatus === "safe"
      ? "SAFE CONTENT"
      : note.moderationStatus === "blocked"
      ? "BLOCKED"
      : note.moderationStatus === "processing"
      ? "AI REVIEWING..."
      : "PENDING"}
  </div>
)}

          
          {/* Description */}
          <p className="text-gray-600 dark:text-slate-300 text-sm line-clamp-2 mb-6 flex-grow">
            {note.description || "Comprehensive notes covering key concepts, formulas, and practical examples for this subject."}
          </p>

          {/* Footer Info */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-slate-400">
              <User className="w-4 h-4" />
              <span className="text-xs">{note.uploader?.name || "Anonymous"}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs">{new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="mt-4">
             {/* CRITICAL: Calling onNavigate(note) triggers the HomePage's logic.
               HomePage will check if User is logged in.
               - If YES: Go to /note/:id
               - If NO: Go to /login (with redirect state)
             */}
             <Button 
                onClick={() => onNavigate(note)} 
                variant="outline" 
                className="w-full justify-between group/btn hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400"
             >
                View Details
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;