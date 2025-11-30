import axios from 'axios';
import { API_BASE_URL } from '../data/constants';

// --- Axios Configuration ---
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Attach Token to every request if available
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  
  // Validation to ensure we don't send "null" string
  if (token && token !== "null" && token !== "undefined") {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  
  return config;
}, (error) => Promise.reject(error));


// --- API Functions ---

// 1. Get AI Suggestions for LOCAL Files (Upload from Device)
export const getAISuggestions = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/ai/suggest-metadata', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data; // Returns { title, description, subject, semester, tags }
};

// 2. Get AI Suggestions for DRIVE Files (Picker)
// This sends the Drive ID to the backend, which downloads & analyzes it there.
export const getAIDriveSuggestions = async (fileId, googleToken, filename, mimeType) => {
  const response = await axios.post('/api/ai/suggest-drive-metadata', {
    fileId, 
    googleToken, 
    filename, 
    mimeType
  });
  return response.data; // Returns { title, description, subject, semester, tags }
};

// 3. Semantic Search
export const searchNotesSemantic = async (query) => {
  const response = await axios.get('/api/notes', {
    params: { q: query, type: 'semantic' }
  });
  return response.data;
};

// 4. Quick Text Moderation (Optional utility)
export const checkTextSafety = async (text) => {
  const response = await axios.get('/api/ai/moderate', {
    params: { text }
  });
  return response.data;
};

// 5. MiniMax / Text Gen Helper (Legacy/Test)
export const fetchMiniMaxContent = async (userQuery, systemPrompt) => {
   // This is a placeholder if you still use NoteTitleSuggestor.jsx
   // You can replace this with a real backend call if needed.
   return { text: "AI Title Suggestion Placeholder" };
};

// Export the configured instance as default
export default axios;