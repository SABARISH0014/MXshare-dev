import React, { useState, useContext, useEffect } from 'react';
import { flushSync } from "react-dom"; 
import { PlayCircle, Cloud, X, Loader2, Send, CheckCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { Button, Input, Select } from './ui/primitives';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, syllabusData } from '../data/constants';
import { useGoogleLogin } from '@react-oauth/google';
import { getAISuggestions, getAIDriveSuggestions } from '../utils/api'; 

const FileUploadCard = ({ onFileUploadSuccess }) => {
  const { addToast } = useContext(ToastContext);
  const { authToken, googleAccessToken } = useContext(AuthContext);

  // --- STATE ---
  const [viewMode, setViewMode] = useState('MAIN');
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState('');

  const [driveFile, setDriveFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoMode, setIsVideoMode] = useState(false); 

  // Metadata States
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const getSemesterFromSubject = (sub) => {
    if (!sub) return "";
    const map = {
      "Mathematical Foundations of Computer Science": "1", "Structured Programming Concepts": "1",
      "Data Structures": "1", "Database Systems": "1", "Web Technologies": "1",
      "C Programming Laboratory": "1", "Data Structures Laboratory": "1", "Web Application Development": "1",
      "Software Engineering": "2", "Design and Analysis of Algorithms": "2",
      "Object Oriented Programming using Java": "2", "Enterprise Computing Using Full Stack": "2",
      "Java Programming Laboratory": "2", "Mobile Application Development": "2",
      "Professional Communication And Personality Development": "2",
      "Cloud Computing": "3", "Cloud Computing Laboratory": "3", "Mini Project": "3", "Audit Course": "3",
      "Project Work": "4"
    };
    const electives = [
      "Design Patterns","Software Project Management","Security in Computing", "Soft Computing","Computer Networks",
      "Data Mining and Analytics", "Artificial Intelligence","Machine Learning","Internet of Things",
      "Wireless Networks","Deep Learning","Multidimensional Data Structures", "Open Source Systems",
      "Ubiquitous and Pervasive Computing", "Human Computer Interaction","Principles of Compiler Design",
      "Social Networking and Web Mining","Virtual Reality Systems", "Block Chain Technologies and Use Cases",
      "DevOps","Software Testing", "Operating Systems","Optimization Techniques","Numerical Methods",
      "Applied Graph Theory","Entrepreneurship", "Principles of Management and Behavioural Sciences",
      "Accounting and Financial Management"
    ];
    if (electives.includes(sub)) return "3";
    return map[sub] || "";
  };

  // Google Login Logic
  const linkDriveAccount = useGoogleLogin({
    flow: 'auth-code',
    scope: "openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
    onSuccess: async (codeResponse) => {
      try {
        addToast("Linking account...", "info");
        const res = await axios.post(`${API_BASE_URL}/api/auth/google/callback`, {
          code: codeResponse.code,
          redirect_uri: 'postmessage'
        });
        if (res.data.googleAccessToken) {
          localStorage.setItem("googleAccessToken", res.data.googleAccessToken);
          window.location.reload();
        }
      } catch (err) {
        addToast("Failed to link Drive.", "error");
      }
    },
    onError: () => addToast("Linking failed", "error")
  });

  // Load Picker API
  useEffect(() => {
    if (window.google && window.google.picker) {
      setPickerLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("picker", () => setPickerLoaded(true));
    };
    document.body.appendChild(script);
  }, []);

  const resetAll = () => {
    setDriveFile(null);
    setVideoUrl('');
    setCustomTitle('');
    setDescription('');
    setSubject('');
    setSemester('');
    setTags([]);
    setTagInput('');
    setIsAnalyzing(false);
    setIsVideoMode(false);
    setLastAnalyzedUrl('');
  };

  const handleFormCancel = async () => {
    // This is the ONLY place that should force viewMode back to MAIN
    setViewMode("MAIN"); 
    if (driveFile?.fileId && googleAccessToken) {
      try {
        await axios.post(`${API_BASE_URL}/api/notes/drive-cleanup`, {
          fileId: driveFile.fileId,
          googleToken: googleAccessToken
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (err) { console.error(err); }
    }
    resetAll();
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const regex = /^.*(youtu.be\/|watch\?v=|embed\/)([^#&?]*).*/;
    const match = url.match(regex);
    return match && match[2]?.length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Google Picker Logic
  const openGooglePicker = async () => {
    if (!pickerLoaded) return addToast("Picker loading...", "info");
    if (!googleAccessToken) return addToast("Session expired. Login again.", "error");

    try {
      await new Promise(resolve => {
        window.gapi.load("client:picker", async () => {
          await window.gapi.client.load("drive", "v3");
          resolve();
        });
      });

      const pickerCallback = async (data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          flushSync(() => {
            setDriveFile({
              fileId: doc.id,
              name: doc.name,
              iconUrl: doc.iconUrl,
              mimeType: doc.mimeType
            });
            setCustomTitle(doc.name);
            setIsVideoMode(false);
            setViewMode("FORM");
          });
          
          // Trigger AI for Drive File
          requestAnimationFrame(async () => {
            setIsAnalyzing(true);
            try {
              const suggestions = await getAIDriveSuggestions(doc.id, googleAccessToken, doc.name, doc.mimeType);
              if (suggestions.title) setCustomTitle(suggestions.title);
              if (suggestions.description) setDescription(suggestions.description);
              if (suggestions.subject) {
                setSubject(suggestions.subject);
                const correctSem = getSemesterFromSubject(suggestions.subject);
                setSemester(correctSem || suggestions.semester || "");
              }
              if (suggestions.tags) setTags(suggestions.tags);
            } catch (error) {
              console.error("AI Meta Error:", error);
            } finally {
              setIsAnalyzing(false);
            }
          });
        }
      };

      const picker = new window.google.picker.PickerBuilder()
        .setOAuthToken(googleAccessToken)
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setAppId(import.meta.env.VITE_GOOGLE_APP_ID)
        .addView(new window.google.picker.DocsUploadView())
        .addView(new window.google.picker.DocsView(window.google.picker.ViewId.DOCS))
        .setOrigin(location.protocol + "//" + location.host)
        .setCallback(pickerCallback)
        .build();
      picker.setVisible(true);
    } catch (e) { console.error(e); }
  };

  // Local File Logic
  const handleLocalFileAnalysis = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const data = await getAISuggestions(file);
      if (data.title) setCustomTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.subject) {
          setSubject(data.subject);
        const correctSem = getSemesterFromSubject(data.subject);
        if (correctSem) setSemester(correctSem);
        else if (data.semester) setSemester(data.semester);
      }
      if (data.tags) setTags(data.tags);
      addToast("Fields auto-filled by AI!", "success");
    } catch (err) {
      addToast("AI Analysis failed.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =============================
  // AUTO-AI ANALYSIS (DEBOUNCE)
  // =============================
  // =============================
  // AUTO-AI ANALYSIS (DEBOUNCE)
  // =============================
  useEffect(() => {
    const isValidUrl = (string) => {
      try { return Boolean(new URL(string)); } catch (e) { return false; }
    };

    if (!videoUrl || !isValidUrl(videoUrl) || videoUrl === lastAnalyzedUrl) return;

    const timer = setTimeout(async () => {
      console.log("🤖 AI Triggered for:", videoUrl);
      
      setIsAnalyzing(true);
      // setViewMode("FORM"); // Component is already in FORM mode, this is redundant but safe
      
      // 1. Comment this out to stop the "start" toast from crashing it
      // addToast("Link detected! AI is analyzing...", "info"); 

      try {
        const blob = new Blob([`Analyze educational metadata: ${videoUrl}`], { type: "text/plain" });
        const virtualFile = new File([blob], "video_context.txt", { type: "text/plain" });

        const data = await getAISuggestions(virtualFile);
        console.log("✅ AI Response:", data);

        // Safe State Updates
        // Note: We use functional updates to ensure we don't depend on stale state
        if (data.title && data.title !== "Untitled") setCustomTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.subject) {
          setSubject(data.subject);
          const sem = getSemesterFromSubject(data.subject);
          setSemester(sem || data.semester || ""); // Fixed logic to fallback to API semester
        }
        if (data.tags) setTags(data.tags);

        setLastAnalyzedUrl(videoUrl);

        // 2. Comment this out to stop the "success" toast from crashing it
        // addToast("✨ Data auto-filled!", "success");

      } catch (err) {
        console.error("❌ Auto-AI failed:", err);
        // addToast("AI Analysis failed.", "error");
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500); 

    return () => clearTimeout(timer);
  }, [videoUrl, lastAnalyzedUrl, addToast]); // Added addToast to dependencies


  // Submit Logic
  const handleSubmit = async () => {
    if (!customTitle || !subject || !semester) return addToast("Please fill required fields.", "error");
    if (!driveFile && !videoUrl) return addToast("Attach a file or a video link.", "error");

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${authToken}` } };

    try {
      let res;
      if (driveFile) {
        res = await axios.post(`${API_BASE_URL}/api/notes/import-drive`, {
          userFileId: driveFile.fileId,
          googleToken: googleAccessToken,
          name: customTitle,
          description,
          subject,
          semester,
          cleanup: true, 
          tags
        }, config);
      } else {
        res = await axios.post(`${API_BASE_URL}/api/notes/save-drive-reference`, {
          videoUrl,
          name: customTitle,
          description,
          subject,
          semester,
          tags
        }, config);
      }

      if (res?.data) {
        addToast("Uploaded! AI is indexing content...", "success");
        onFileUploadSuccess?.(res.data.note);
        resetAll();
        setViewMode("MAIN");
      }
    } catch (err) {
      console.error(err);
      addToast("Upload failed.", "error");
    }
    setIsSubmitting(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (t) => setTags(tags.filter(tag => tag !== t));

  // =============================
  // RENDER - SHIELDED
  // =============================
  // We wrap EVERYTHING in a div that catches 'onSubmit' just in case this component 
  // is placed inside a parent <form>.
  
  return (
    <div 
      className="h-full"
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {viewMode === "MAIN" ? (
        <div className="bg-white dark:bg-slate-900 dim:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 dim:border-slate-600 p-8 h-full flex flex-col justify-center transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Share Learning Material</h2>
          
          {!googleAccessToken ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl text-center mb-6">
              <p className="text-blue-800 dark:text-blue-300 mb-4 text-sm">Connect Google Drive to start uploading.</p>
              <Button onClick={linkDriveAccount} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3">
                <Cloud className="w-5 h-5 mr-2" /> Connect Google Drive
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <button 
                type="button"
                onClick={openGooglePicker} 
                className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800 dim:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-md group"
              >
                <Cloud className="w-14 h-14 text-blue-600 dark:text-blue-500 mb-3" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">Upload File</span>
                <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">Google Drive + AI Scan</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  if (driveFile) handleFormCancel(); 
                  setVideoUrl(''); 
                  setIsVideoMode(true); 
                  setViewMode('FORM'); 
                }} 
                className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800 dim:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-md group"
              >
                <PlayCircle className="w-14 h-14 text-red-500 mb-3" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">Video Link</span>
                <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">YouTube / Vimeo</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        // FORM VIEW
        <div className="bg-white dark:bg-slate-900 dim:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 dim:border-slate-600 p-6 h-full overflow-y-auto transition-colors">
          
          <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-slate-700 pb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Finalize Details</h3>
            <Button variant="ghost" onClick={handleFormCancel}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>

          {/* AI Analyzing Banner */}
          {isAnalyzing && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl flex items-center justify-center gap-3 animate-pulse border border-blue-100 dark:border-blue-800">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium text-sm">AI is analyzing...</span>
            </div>
          )}

          {/* Fallback Local Upload (Hidden in Video Mode) */}
          {!driveFile && !isVideoMode && (
            <div className="mb-6">
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group">
                  <input type="file" className="hidden" onChange={handleLocalFileAnalysis} accept=".pdf,.txt,.docx" />
                  <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5 mr-2" /> Upload local file to Auto-fill Metadata with AI
                  </span>
                </label>
            </div>
          )}

          {/* File/Link Preview Section */}
          <div className="mb-6 bg-gray-50 dark:bg-slate-800 dim:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-700 dim:border-slate-600 p-4 flex flex-col items-center transition-colors">
            {driveFile ? (
              <>
                <img src={driveFile.iconUrl} className="w-10 h-10 mb-3" alt="File Icon" />
                <p className="text-gray-700 dark:text-slate-200 font-semibold text-center">{driveFile.name}</p>
                <span className="text-xs text-green-600 dark:text-green-400 mt-2 flex gap-1 items-center">
                  <CheckCircle className="w-3 h-3" /> Ready to Transfer
                </span>
              </>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Video Link</label>
                  {isAnalyzing && (
                    <span className="flex items-center text-xs text-blue-600 animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> AI Analyzing...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input 
                    placeholder="Paste YouTube or Vimeo link here..." 
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)} 
                    className="pr-10" 
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : videoUrl && videoUrl === lastAnalyzedUrl ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <PlayCircle className="w-5 h-5" />
                    )}
                  </div>
                </div>
                
                {getYoutubeEmbed(videoUrl) && (
                  <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden shadow-md">
                    <iframe src={getYoutubeEmbed(videoUrl)} className="w-full h-full" allowFullScreen title="Video Preview" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <Input label="Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-slate-600 transition-colors"
                    rows="2" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe the content..." 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="">Select...</option>
                {syllabusData.semesters.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
              </Select>
              <Select label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">Select...</option>
                {syllabusData.subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Tags</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-10 rounded-md border border-gray-300 dark:border-slate-700 dim:border-slate-600 px-3 text-gray-900 dark:text-white bg-white dark:bg-slate-900 dim:bg-slate-800 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition-colors"
                  placeholder="Add tag..." 
                  value={tagInput} 
                  onChange={(e) => setTagInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addTag()} 
                />
                <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {tags.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    {t} <button type="button" onClick={() => removeTag(t)} className="text-blue-900 dark:text-blue-200 hover:text-red-600 dark:hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white h-12">
              {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Publishing...</> : <><Send className="mr-2" /> Publish Material</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(FileUploadCard);