import React, { useState, useContext, useEffect } from 'react';
import { flushSync } from "react-dom";
import { PlayCircle, Cloud, X, Loader2, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { Button, Input, Select } from './ui/primitives';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, syllabusData } from '../data/constants';
import { useGoogleLogin } from '@react-oauth/google';

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

  // =============================
  // GOOGLE ACCOUNT LINKING
  // =============================
  const linkDriveAccount = useGoogleLogin({
    flow: 'auth-code',
    scope: "openid profile email https://www.googleapis.com/auth/drive.file",
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
  // LOAD GOOGLE PICKER
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
  // CUSTOM EVENT LISTENER (CORE!)
  // =============================
  useEffect(() => {
    const onFileSelected = (event) => {
      const file = event.detail;

      flushSync(() => {
        setDriveFile(file);
        setCustomTitle(file.name);
        setViewMode("FORM");
      });
    };

    window.addEventListener("mxshare-file-selected", onFileSelected);
    return () => window.removeEventListener("mxshare-file-selected", onFileSelected);
  }, []);

  // =============================
  // RESET ALL STATES
  // =============================
  const resetAll = () => {
    flushSync(() => {
      setViewMode('MAIN');
      setDriveFile(null);
      setVideoUrl('');
      setCustomTitle('');
      setSubject('');
      setSemester('');
      setTags([]);
      setTagInput('');
    });
  };

  // =============================
  // YOUTUBE EMBED
  // =============================
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const regex = /^.*(youtu.be\/|watch\?v=|embed\/)([^#&?]*).*/;
    const match = url.match(regex);
    return match && match[2]?.length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  // =============================
  // OPEN GOOGLE PICKER (EVENT → FORM LOGIC)
  // =============================
  const openGooglePicker = () => {
    if (!pickerLoaded) return addToast("Picker loading...", "info");
    if (!googleAccessToken) return addToast("Session expired. Login again.", "error");

    const pickerCallback = (data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];

        const event = new CustomEvent("mxshare-file-selected", {
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

  // =============================
  // SUBMIT HANDLER
  // =============================
  const handleSubmit = async () => {
    if (!customTitle || !subject || !semester)
      return addToast("Please fill required fields.", "error");

    if (!driveFile && !videoUrl)
      return addToast("Attach a file or a video link.", "error");

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${authToken}` } };

    try {
      let res;

      if (driveFile) {
        res = await axios.post(`${API_BASE_URL}/api/notes/import-drive`, {
          userFileId: driveFile.fileId,
          googleToken: googleAccessToken,
          name: customTitle,
          subject,
          semester,
          cleanup: true,   // <-- YOU FORGOT THIS!
          tags
        }, config);
      } else {
        res = await axios.post(`${API_BASE_URL}/api/notes/save-drive-reference`, {
          videoUrl,
          name: customTitle,
          subject,
          semester,
          tags
        }, config);
      }

      if (res?.data) {
        addToast("Uploaded successfully!", "success");
        onFileUploadSuccess?.(res.data.note);
        resetAll();
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
  // RENDER (LIGHT MODE)
  // =============================

  if (viewMode === "MAIN") {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 h-full flex flex-col justify-center">

        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Share Learning Material
        </h2>

        {!googleAccessToken ? (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center mb-6">
            <p className="text-blue-800 mb-4 text-sm">
              Connect Google Drive before uploading.
            </p>

            <Button
              onClick={linkDriveAccount}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3"
            >
              <Cloud className="w-5 h-5 mr-2" /> Connect Google Drive
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            
            <button
              onClick={openGooglePicker}
              className="flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all hover:shadow-md"
            >
              <Cloud className="w-14 h-14 text-blue-600 mb-3" />
              <span className="text-lg font-bold text-gray-800">Upload File</span>
              <span className="text-xs text-gray-500 mt-1">Google Drive</span>
            </button>

            <button
              onClick={() => { setVideoUrl(''); setViewMode('FORM'); }}
              className="flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-xl transition-all hover:shadow-md"
            >
              <PlayCircle className="w-14 h-14 text-red-500 mb-3" />
              <span className="text-lg font-bold text-gray-800">Video Link</span>
              <span className="text-xs text-gray-500 mt-1">YouTube / Vimeo</span>
            </button>

          </div>
        )}
      </div>
    );
  }

  // =============================
  // FORM VIEW
  // =============================
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full overflow-y-auto">

      <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900">Finalize Details</h3>

        <Button variant="ghost" onClick={resetAll}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>

      {/* Preview */}
      <div className="mb-6 bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col items-center">

        {driveFile ? (
          <>
            <img src={driveFile.iconUrl} className="w-10 h-10 mb-3" />
            <p className="text-gray-700 font-semibold">{driveFile.name}</p>
            <span className="text-xs text-green-600 mt-2 flex gap-1 items-center">
              <CheckCircle className="w-3 h-3" /> Ready to Transfer
            </span>
          </>
        ) : (
          <div className="w-full">
            <Input
              label="Video URL"
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            {getYoutubeEmbed(videoUrl) && (
              <div className="mt-4 aspect-video bg-black rounded overflow-hidden">
                <iframe src={getYoutubeEmbed(videoUrl)} className="w-full h-full" allowFullScreen />
              </div>
            )}
          </div>
        )}

      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        
        <Input label="Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">Select...</option>
            {syllabusData.semesters.map(s => (
              <option key={s.value} value={s.value}>{s.name}</option>
            ))}
          </Select>

          <Select label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select...</option>
            {syllabusData.subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        {/* TAGS */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Tags</label>

          <div className="flex gap-2">
            <input
              className="flex-1 h-10 rounded-md border border-gray-300 px-3 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />

            <Button variant="secondary" onClick={addTag}>Add</Button>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            {tags.map(t => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2"
              >
                {t}
                <button onClick={() => removeTag(t)} className="text-blue-900 hover:text-red-600">&times;</button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white h-12"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Publishing...
            </>
          ) : (
            <>
              <Send className="mr-2" /> Publish Material
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUploadCard;
