import React, { useState, useContext, useEffect } from 'react';
import { FileText, PlayCircle, Cloud, X, Loader2, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { Button, Input, Select } from './ui/primitives'; 
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, syllabusData } from '../data/constants';

const FileUploadCard = ({ onFileUploadSuccess }) => {
  const { addToast } = useContext(ToastContext);
  const { authToken, googleAccessToken } = useContext(AuthContext);
  
  const [viewMode, setViewMode] = useState('MAIN'); 
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driveFile, setDriveFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // DEBUG LOG
  useEffect(() => {
    console.log("♻️ COMPONENT RENDERED. Mode:", viewMode, "File:", driveFile);
  }, [viewMode, driveFile]);

  // --- 1. LOAD PICKER ---
  useEffect(() => {
    if (window.google && window.google.picker) {
        setPickerLoaded(true);
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        window.gapi.load('picker', () => setPickerLoaded(true));
    };
    document.body.appendChild(script);
  }, []);

  // --- 2. EVENT LISTENER FOR FILE SELECTION (THE FIX) ---
  useEffect(() => {
    const handleFileSelection = (event) => {
        console.log("🚀 Custom Event Caught:", event.detail);
        const file = event.detail;
        setDriveFile(file);
        setCustomTitle(file.name);
        setViewMode('FORM'); // Force View Update
    };

    window.addEventListener('mxshare-file-selected', handleFileSelection);
    return () => window.removeEventListener('mxshare-file-selected', handleFileSelection);
  }, []);

  const resetAll = () => {
    setViewMode('MAIN');
    setDriveFile(null);
    setVideoUrl('');
    setCustomTitle('');
    setSubject('');
    setSemester('');
    setTags([]);
    setTagInput('');
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // --- 3. OPEN PICKER ---
  const openGooglePicker = () => {
    if (!pickerLoaded) return addToast("Picker loading...", "info");
    if (!googleAccessToken) return addToast("Session expired. Login again.", "error");

    const pickerCallback = (data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        console.log("✅ Callback Raw Data:", doc);

        // DISPATCH CUSTOM EVENT to break out of iframe context
        const event = new CustomEvent('mxshare-file-selected', { 
            detail: {
                fileId: doc.id,
                name: doc.name,
                iconUrl: doc.iconUrl
            }
        });
        window.dispatchEvent(event);
      }
    };

    const uploadView = new window.google.picker.DocsUploadView();
    const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    docsView.setIncludeFolders(true);
    docsView.setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .setAppId(import.meta.env.VITE_GOOGLE_APP_ID)
      .setOAuthToken(googleAccessToken)
      .addView(uploadView)
      .addView(docsView)
      .setCallback(pickerCallback)
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .build();

    picker.setVisible(true);
  };

  // --- 4. SUBMIT ---
  const handleSubmit = async () => {
    if (!customTitle || !subject || !semester) return addToast("Fill required fields.", "error");
    
    setIsSubmitting(true);
    const config = { headers: { 'Authorization': `Bearer ${authToken}` } };

    try {
      let res;

      // CASE 1: FILE (Import & Clone)
      if (driveFile) {
        res = await axios.post(`${API_BASE_URL}/api/notes/import-drive`, {
          userFileId: driveFile.fileId,
          googleToken: googleAccessToken, 
          name: customTitle,
          subject,
          semester,
          tags,
          cleanup: true 
        }, config);
      } 
      
      // CASE 2: VIDEO (Create .url file)
      else if (videoUrl) {
        // We send the URL as a string. The Backend handles the file creation.
        res = await axios.post(`${API_BASE_URL}/api/notes/save-drive-reference`, {
           videoUrl: videoUrl, 
           name: customTitle, 
           subject, 
           semester, 
           // Ensure tags are sent as string to match local upload format
           tags: JSON.stringify(tags) 
        }, config);
      }

      if (res?.data) {
        addToast("Uploaded successfully!", "success");
        if (onFileUploadSuccess) onFileUploadSuccess(res.data.note);
        resetAll();
      }
    } catch (err) {
      console.error(err);
      addToast("Upload failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
    }
  };
  const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));

  // ==========================================
  // RENDER
  // ==========================================

  if (viewMode === 'MAIN') {
    return (
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800 h-full flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Share Learning Material</h2>
        <div className="grid grid-cols-2 gap-6">
          <button onClick={openGooglePicker} className="flex flex-col items-center justify-center p-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all hover:-translate-y-1 group">
            <Cloud className="w-16 h-16 text-blue-400 mb-4 group-hover:text-white" />
            <span className="text-lg font-bold text-gray-100">Upload File</span>
            <span className="text-xs text-gray-500 mt-1">Computer or Drive</span>
          </button>
          
          <button onClick={() => { setVideoUrl(''); setViewMode('FORM'); }} className="flex flex-col items-center justify-center p-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all hover:-translate-y-1 group">
            <PlayCircle className="w-16 h-16 text-red-400 mb-4 group-hover:text-white" />
            <span className="text-lg font-bold text-gray-100">Video Link</span>
            <span className="text-xs text-gray-500 mt-1">YouTube / Vimeo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-800 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
        <h3 className="text-xl font-bold text-white">Finalize Details</h3>
        <Button variant="ghost" size="sm" onClick={resetAll}><X className="w-4 h-4 mr-1" /> Cancel</Button>
      </div>

      {/* Preview */}
      <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col items-center">
         {driveFile ? (
            <>
                <img src={driveFile.iconUrl} className="w-8 h-8 mb-2" alt="File Icon" />
                <p className="text-white font-medium text-center">{driveFile.name}</p>
                <p className="text-xs text-green-400 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3"/> Ready to Transfer</p>
            </>
         ) : (
            <div className="w-full">
               <Input label="Video Link" value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} placeholder="https://..." />
               {getYoutubeEmbed(videoUrl) && <div className="mt-2 aspect-video bg-black rounded"><iframe src={getYoutubeEmbed(videoUrl)} className="w-full h-full" allowFullScreen /></div>}
            </div>
         )}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <Input label="Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
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
        <div className="flex gap-2">
            <input className="flex-1 h-10 rounded-lg bg-gray-800 border border-gray-700 px-3 text-white outline-none" placeholder="Add tag..." value={tagInput} onChange={(e)=>setTagInput(e.target.value)} />
            <Button variant="secondary" onClick={handleAddTag}>Add</Button>
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
            {tags.map(t => <span key={t} className="px-2 py-1 bg-blue-900 text-xs rounded text-blue-200 flex items-center gap-1 border border-blue-800">{t} <button onClick={() => handleRemoveTag(t)} className="hover:text-white">&times;</button></span>)}
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-4">
            {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Transferring...</> : <><Send className="mr-2" /> Publish</>}
        </Button>
      </div>
    </div>
  );
};

export default FileUploadCard;