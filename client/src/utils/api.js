import axios from 'axios';
import { API_BASE_URL } from '../data/constants';

// Axios Interceptor Configuration
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  
  // CRITICAL CHECK: Ensure token is not null, undefined, or the string "null"
  if (token && token !== "null" && token !== "undefined") {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const fetchMiniMaxContent = async (userQuery, systemPrompt, retries = 3) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const text = systemPrompt && systemPrompt.includes("Output ONLY a comma-separated list")
        ? "Electromagnetic Wave Analysis, RF Circuit Design Principles, Antenna Theory and Applications"
        : "The second law of thermodynamics governs the direction of physical processes, ensuring entropy increase in isolated systems, and setting limits on heat engine efficiency.";
    return { text };
};

// 1. Get AI Suggestions for Title/Tags
export const getAISuggestions = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/api/ai/suggest-metadata`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data; // { title, description, tags }
};

// 2. Semantic Search
export const searchNotesSemantic = async (query) => {
  const response = await axios.get(`${API_BASE_URL}/api/notes`, {
    params: { q: query, type: 'semantic' }
  });
  return response.data;
};

// 3. Quick Moderation Check (Useful for client-side validation before submit)
export const checkTextSafety = async (text) => {
  const response = await axios.get(`${API_BASE_URL}/api/ai/moderate`, {
    params: { text }
  });
  return response.data; // { isSafe: boolean, ... }
};

// ... existing code ...

// Export the configured instance as default
export default axios;