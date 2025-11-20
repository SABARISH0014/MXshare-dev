import React, { useState, useContext } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button, Input } from '../components/ui/primitives';
import { ToastContext } from '../context/ToastContext';

const EMAIL_REGEX = /^\d+[a-zA-Z]+\d+@psgtech\.ac\.in$/i;

const AuthForm = ({ type, onNavigate, onAuthSuccess }) => {
  const isLogin = type === "Login";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useContext(ToastContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError("");
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: "openid profile email https://www.googleapis.com/auth/drive.file",
    redirect_uri: "http://localhost:5173/auth/google/callback",
    onError: () => addToast("Google Sign-In failed.", "error"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(formData.email)) {
      setError("Access restricted: Please use your official MCA roll no. (e.g., 25MX343@psgtech.ac.in).");
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    // Simulate network delay or call real API here
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const mockUser = {
        name: isLogin ? formData.email.split("@")[0] : formData.name,
        email: formData.email,
        _id: "mock_id_" + Date.now(),
        createdAt: new Date().toISOString(),
      };

      addToast(`${isLogin ? "Welcome back" : "Welcome aboard"}, MXian!`, "success");
      onAuthSuccess("mock_local_token_123", mockUser, "mock_local_refresh_token");
    } catch (err) {
      setError("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-950 p-4">
      <button onClick={() => onNavigate('')} className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors font-medium">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
      </button>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <h2 className="text-3xl font-extrabold text-white text-center">{isLogin ? "Login to MXShare" : "Join MXShare Today"}</h2>
        <p className="text-center text-sm text-blue-400 font-semibold">MCA Department Access Only</p>

        <Button onClick={() => googleLogin()} variant="secondary" className="w-full flex items-center justify-center space-x-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In with College Google"}
        </Button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">or using email</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm font-medium text-red-500 text-center bg-red-900/20 p-2 rounded-lg">{error}</p>}
          {!isLogin && <Input label="Full Name" id="name" value={formData.name} onChange={handleChange} required />}
          <Input label="College Email" id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="25MX343@psgtech.ac.in" />
          <Input label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required />
          {!isLogin && <Input label="Confirm Password" id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />}
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Processing..." : (isLogin ? "Sign In Securely" : "Create Account")}</Button>
        </form>

        <p className="text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account?" : "Already an MXian?"}{" "}
          <button type="button" onClick={() => onNavigate(isLogin ? "signup" : "login")} className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;