import axios from 'axios';

// Axios Interceptor Configuration
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export const fetchMiniMaxContent = async (userQuery, systemPrompt, retries = 3) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const text = systemPrompt && systemPrompt.includes("Output ONLY a comma-separated list")
        ? "Electromagnetic Wave Analysis, RF Circuit Design Principles, Antenna Theory and Applications"
        : "The second law of thermodynamics governs the direction of physical processes, ensuring entropy increase in isolated systems, and setting limits on heat engine efficiency.";
    return { text };
};