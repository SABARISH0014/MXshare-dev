import React, { useState, useContext } from 'react';
import { FileText, PlayCircle, X, Loader2, Send } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { Button, Input, Select } from './ui/primitives';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, syllabusData } from '../data/constants';

const FileUploadCard = ({ onFileUploadSuccess }) => {
  const { addToast } = useContext(ToastContext);
  const { authToken } = useContext(AuthContext);

  const [mode, setMode] = useState('selection'); 
  const [selectedFile, setSelectedFile] = useState(null); 
  const [videoUrl, setVideoUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

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

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

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

  const loginToDrive = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await loadPickerApi();
      createPicker(tokenResponse.access_token);
    },
    scope: "https://www.googleapis.com/auth/drive.file",
    onError: () => addToast("Failed to authorize Google Drive", "error"),
  });

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

      <div className="mb-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
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

export default FileUploadCard;