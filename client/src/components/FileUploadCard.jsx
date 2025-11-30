import React, { useState, useContext, useEffect, useRef } from 'react';
import { flushSync } from "react-dom"; // <--- 1. CRITICAL IMPORT
import { PlayCircle, Cloud, X, Loader2, Send, CheckCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { Button, Input, Select } from './ui/primitives';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, syllabusData } from '../data/constants';
import { useGoogleLogin } from '@react-oauth/google';
// 2. Import AI Helpers
import { getAISuggestions, getAIDriveSuggestions } from '../utils/api'; 

const FileUploadCard = ({ onFileUploadSuccess }) => {
  const { addToast } = useContext(ToastContext);
  const { authToken, googleAccessToken } = useContext(AuthContext);

  // --- STATE ---
  const [viewMode, setViewMode] = useState('MAIN');
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // AI Loading State

  const [driveFile, setDriveFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  
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
    "Mathematical Foundations of Computer Science": "1",
    "Structured Programming Concepts": "1",
    "Data Structures": "1",
    "Database Systems": "1",
    "Web Technologies": "1",
    "C Programming Laboratory": "1",
    "Data Structures Laboratory": "1",
    "Web Application Development": "1",

    "Software Engineering": "2",
    "Design and Analysis of Algorithms": "2",
    "Object Oriented Programming using Java": "2",
    "Enterprise Computing Using Full Stack": "2",
    "Java Programming Laboratory": "2",
    "Mobile Application Development": "2",
    "Professional Communication And Personality Development": "2",

    "Cloud Computing": "3",
    "Cloud Computing Laboratory": "3",
    "Mini Project": "3",
    "Audit Course": "3",

    "Project Work": "4"
  };

  // Electives default to Semester 3
  const electives = [
    "Design Patterns","Software Project Management","Security in Computing",
    "Soft Computing","Computer Networks","Data Mining and Analytics",
    "Artificial Intelligence","Machine Learning","Internet of Things",
    "Wireless Networks","Deep Learning","Multidimensional Data Structures",
    "Open Source Systems","Ubiquitous and Pervasive Computing",
    "Human Computer Interaction","Principles of Compiler Design",
    "Social Networking and Web Mining","Virtual Reality Systems",
    "Block Chain Technologies and Use Cases","DevOps","Software Testing",
    "Operating Systems","Optimization Techniques","Numerical Methods",
    "Applied Graph Theory","Entrepreneurship",
    "Principles of Management and Behavioural Sciences",
    "Accounting and Financial Management"
  ];

  if (electives.includes(sub)) return "3";

  return map[sub] || "";
};


  // =============================
  // 1. GOOGLE ACCOUNT LINKING
  // =============================
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
        } else {
          addToast("Linked, but token missing. Try refreshing.", "warning");
        }
      } catch (err) {
        addToast("Failed to link Drive.", "error");
      }
    },
    onError: () => addToast("Linking failed", "error")
  });

  // =============================
  // 2. LOAD GOOGLE PICKER API
  // =============================
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

  // =============================
  // 3. UTILS & CLEANUP
  // =============================
  const resetAll = () => {
    // Wrap reset in flushSync to ensure clean UI state immediately
    flushSync(() => {
        setDriveFile(null);
        setVideoUrl('');
        setCustomTitle('');
        setDescription('');
        setSubject('');
        setSemester('');
        setTags([]);
        setTagInput('');
        setViewMode('MAIN');
        setIsAnalyzing(false);
    });
  };

  const handleFormCancel = async () => {
  if (driveFile?.fileId && googleAccessToken) {
    try {
      await axios.post(`${API_BASE_URL}/api/notes/drive-cleanup`, {
        fileId: driveFile.fileId,
        googleToken: googleAccessToken
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
           console.log("🔥 Drive clone removed");
      addToast("File removed from Drive.", "success");
    } catch (err) {
      console.error("Drive cleanup failed:", err);
    }
  }
  resetAll();
};

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const regex = /^.*(youtu.be\/|watch\?v=|embed\/)([^#&?]*).*/;
    const match = url.match(regex);
    return match && match[2]?.length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // =============================
  // 4. OPEN GOOGLE PICKER (THE CRITICAL FIX)
  // =============================
  const openGooglePicker = async () => {
  if (!pickerLoaded) return addToast("Picker loading...", "info");
  if (!googleAccessToken) return addToast("Session expired. Login again.", "error");

  try {
    // Ensure Drive API is ready
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
    setViewMode("FORM");
  });

  // ⏳ Wait for UI to update fully **before AI work**
  requestAnimationFrame(async () => {

    const validTypes = ['pdf', 'application/pdf', 'text', 'word', 'image'];
    if (!validTypes.some(t => doc.mimeType.includes(t))) {
      addToast("Unsupported file type", "warning");
      return;
    }

    setIsAnalyzing(true);

    try {
      const suggestions = await getAIDriveSuggestions(
        doc.id,
        googleAccessToken,
        doc.name,
        doc.mimeType
      );

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
      addToast("AI metadata failed.", "error");
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
  } catch (e) {
    console.error(e);
    addToast("Failed to load picker.", "error");
  }
};

  // =============================
  // 5. LOCAL FILE ANALYSIS (Fallback)
  // =============================
  const handleLocalFileAnalysis = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    addToast("Uploading for AI analysis...", "info");
    
    try {
      const data = await getAISuggestions(file);
      
      if (data.title) setCustomTitle(data.title);
      if (data.description) setDescription(data.description);
      if (suggestions.subject) {
          setSubject(suggestions.subject);
        // Auto-correct Semester using our map
        const correctSem = getSemesterFromSubject(suggestions.subject);
        if (correctSem) setSemester(correctSem);
        else if (suggestions.semester) setSemester(suggestions.semester);
}
      if (data.tags) setTags(data.tags);

      
      addToast("Fields auto-filled by AI!", "success");
    } catch (err) {
      console.error(err);
      addToast("AI Analysis failed.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =============================
  // 6. FORM SUBMISSION
  // =============================
  const handleSubmit = async () => {
    if (!customTitle || !subject || !semester) return addToast("Please fill required fields.", "error");
    if (!driveFile && !videoUrl) return addToast("Attach a file or a video link.", "error");

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${authToken}` } };

    try {
      let res;
      if (driveFile) {
        // Import Logic
        res = await axios.post(`${API_BASE_URL}/api/notes/import-drive`, {
          userFileId: driveFile.fileId,
          googleToken: googleAccessToken,
          name: customTitle,
          description, // Include description
          subject,
          semester,
          cleanup: true, 
          tags
        }, config);
      } else {
        // Video Link Logic
        res = await axios.post(`${API_BASE_URL}/api/notes/save-drive-reference`, {
          videoUrl,
          name: customTitle,
          description, // Include description
          subject,
          semester,
          tags
        }, config);
      }

      if (res?.data) {
        addToast("Uploaded! AI is indexing content...", "success");
        onFileUploadSuccess?.(res.data.note);
        resetAll();
      }
    } catch (err) {
      console.error(err);
      addToast("Upload failed.", "error");
    }
    setIsSubmitting(false);
  };

  // Tag Logic
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (t) => setTags(tags.filter(tag => tag !== t));

  // =============================
  // 7. RENDER
  // =============================

  if (viewMode === "MAIN") {
    return (
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
            <button onClick={openGooglePicker} className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800 dim:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-md group">
              <Cloud className="w-14 h-14 text-blue-600 dark:text-blue-500 mb-3" />
              <span className="text-lg font-bold text-gray-800 dark:text-white">Upload File</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">Google Drive + AI Scan</span>
            </button>

            <button onClick={() => {if (driveFile) handleFormCancel();  setVideoUrl(''); setViewMode('FORM'); }} className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800 dim:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-md group">
              <PlayCircle className="w-14 h-14 text-red-500 mb-3" />
              <span className="text-lg font-bold text-gray-800 dark:text-white">Video Link</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">YouTube / Vimeo</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // FORM VIEW
  return (
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
            <span className="font-medium text-sm">AI is analyzing document...</span>
         </div>
      )}

      {/* Manual AI Upload Option (Fallback) */}
      {!driveFile && !videoUrl && (
        <div className="mb-6">
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group">
               <input type="file" className="hidden" onChange={handleLocalFileAnalysis} accept=".pdf,.txt,.docx" />
               <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 mr-2" /> Upload local file to Auto-fill Metadata with AI
               </span>
            </label>
        </div>
      )}

      {/* File Preview */}
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
            <Input label="Video URL" placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            {getYoutubeEmbed(videoUrl) && (
              <div className="mt-4 aspect-video bg-black rounded overflow-hidden">
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
                placeholder="Briefly describe the content (AI will auto-fill this)..." 
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
              placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} 
            />
            <Button variant="secondary" onClick={addTag}>Add</Button>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {tags.map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                {t} <button onClick={() => removeTag(t)} className="text-blue-900 dark:text-blue-200 hover:text-red-600 dark:hover:text-red-400">&times;</button>
              </span>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white h-12">
          {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Publishing...</> : <><Send className="mr-2" /> Publish Material</>}
        </Button>
      </div>
    </div>
  );
};

export default FileUploadCard;