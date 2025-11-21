import React, { useState, useEffect, useRef, useContext } from 'react';
// REMOVED: import ReactDOM from 'react-dom/client'; 
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Local Imports
import './index.css'; 
import { API_BASE_URL, mockNoteList } from './data/constants';
import './utils/api'; 
import { AuthContext } from './context/AuthContext';
import { ToastContext, NotificationProvider } from './context/ToastContext';

// Pages & Components
import HomePage from './pages/HomePage';
import AuthForm from './pages/AuthPage'; 
import UserDashboard from './pages/Dashboard';
import NoteDetailPage from './pages/NoteDetailPage'; 

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// --- Google Auth Callback ---
const GoogleAuthCallback = () => {
  const { onAuthSuccess } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      const errorMsg = searchParams.get("error") || "Authentication cancelled.";
      if (!handledRef.current) {
        handledRef.current = true;
        addToast(`Google login error: ${errorMsg}`, "error");
      }
      navigate("/login");
      return;
    }

    if (handledRef.current) return;
    handledRef.current = true;

    fetch(`${API_BASE_URL}/api/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.accessToken, data.user, data.refreshToken, data.googleAccessToken, data.googleRefreshToken);
        navigate("/dashboard");
      } else {
        throw new Error(data.message || "Login failed");
      }
    })
    .catch((err) => {
      console.error("Error in GoogleAuthCallback:", err);
      addToast(`Login failed: ${err.message}`, "error");
      navigate("/login");
    });
  }, [searchParams, onAuthSuccess, navigate, addToast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <h2 className="mt-4 text-xl font-semibold text-white">Completing login...</h2>
    </div>
  );
};

// --- Main App Logic ---
const App = () => {
  const [authToken, setAuthToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentDashboardView, setCurrentDashboardView] = useState('main'); 
  const [allNotes, setAllNotes] = useState(mockNoteList); 
  const [user, setUser] = useState(null);
  
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [googleRefreshToken, setGoogleRefreshToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);

  const onNavigate = (path) => navigate(`/${path}`);
  const onDashboardViewChange = (view) => {
    setCurrentDashboardView(view);
    navigate('/dashboard'); 
  };

  const ProtectedRoute = ({ children }) => {
    if (!authChecked) return null;
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  const onAuthSuccess = (accessToken, user, refreshToken, googleAccessToken, googleRefreshToken) => {
    setAuthToken(accessToken);
    setUser(user);
    setRefreshToken(refreshToken);
    setGoogleAccessToken(googleAccessToken || null);
    setGoogleRefreshToken(googleRefreshToken || null);
    
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    if (googleAccessToken) localStorage.setItem("googleAccessToken", googleAccessToken);
    if (googleRefreshToken) localStorage.setItem("googleRefreshToken", googleRefreshToken);
  };

  const onLogout = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
        fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        }).catch(console.error);
    }
    
    localStorage.clear();
    setUser(null);
    setAuthToken(null);
    setGoogleAccessToken(null);
    navigate("/login");
  };

  const refreshAccessToken = async () => {
    const rToken = localStorage.getItem('refreshToken');
    if (!rToken) {
       onLogout();
       return false;
    }
    try {
       const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken: rToken });
       const { accessToken, refreshToken } = res.data;
       localStorage.setItem('authToken', accessToken);
       localStorage.setItem('refreshToken', refreshToken);
       setAuthToken(accessToken);
       return accessToken; 
    } catch (err) {
       onLogout();
       return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      const token = localStorage.getItem("authToken");
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (token) setAuthToken(token);
      
      const gToken = localStorage.getItem("googleAccessToken");
      if (gToken) setGoogleAccessToken(gToken);

      if (!token && !refreshToken) {
        if (mounted) { setUser(null); setAuthChecked(true); }
        return;
      }

      if (token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
          if (mounted) { setUser(res.data.user); setAuthChecked(true); }
          return;
        } catch (err) { /* expired */ }
      }

      const newToken = await refreshAccessToken();
      if (newToken) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
          if (mounted) { setUser(res.data.user); setAuthChecked(true); }
          return;
        } catch (err) { onLogout(); }
      }

      if (mounted) { setUser(null); setAuthChecked(true); }
    };
    checkSession();
    return () => (mounted = false);
  }, []);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
        user, authToken, refreshToken, googleAccessToken, googleRefreshToken, 
        setUser, setAuthToken, setRefreshToken, setGoogleAccessToken, setGoogleRefreshToken, 
        onAuthSuccess 
    }}>
      <Routes>
        <Route path="/" element={<HomePage onNavigate={onNavigate} />} />
        <Route path="/login" element={<AuthForm type="Login" onNavigate={onNavigate} onAuthSuccess={onAuthSuccess} />} />
        <Route path="/signup" element={<AuthForm type="Signup" onNavigate={onNavigate} onAuthSuccess={onAuthSuccess} />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        
        {/* DASHBOARD */}
        <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard
                user={user}
                onLogout={onLogout}
                allNotes={allNotes}
                setAllNotes={setAllNotes}
                currentView={currentDashboardView}
                onDashboardViewChange={onDashboardViewChange}
              />
            </ProtectedRoute>
          } 
        />
        
        {/* NOTE DETAIL PAGE (Corrected ID Routing) */}
        <Route path="/note/:id" element={
            <ProtectedRoute>
              <UserDashboard
                user={user}
                onLogout={onLogout}
                allNotes={allNotes}
                setAllNotes={setAllNotes}
                currentView="detail" // Just to keep dashboard layout active
                onDashboardViewChange={onDashboardViewChange}
              >
                <NoteDetailPage />
              </UserDashboard>
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
};

// --- Wrapper ---
const AppWrapper = () => (
  <GoogleOAuthProvider 
    clientId={GOOGLE_CLIENT_ID} 
    // Scope: 'drive.file' is needed if you use the "Cleanup" feature (deleting from user drive)
    scope="email profile openid https://www.googleapis.com/auth/drive.file"
  >
    <BrowserRouter>
      <NotificationProvider> 
        <App /> 
      </NotificationProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);

export default AppWrapper;