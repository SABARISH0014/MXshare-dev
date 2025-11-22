import React, { useState, useContext } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../components/ui/primitives';
import { ToastContext } from '../context/ToastContext';

const EMAIL_REGEX = /^\d+[a-zA-Z]+\d+@psgtech\.ac\.in$/i;

const AuthForm = ({ type, onNavigate, onAuthSuccess }) => {
  const isLogin = type === "Login";
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: ""
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
    redirect_uri: "http://localhost:5173/auth/google/callback",
    onError: () => addToast("Google login failed", "error"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(formData.email)) {
      setError("Use your official MCA email only (e.g., 25MX343@psgtech.ac.in)");
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    addToast(`Welcome ${isLogin ? "back" : ""}, MXian!`, "success");
    onAuthSuccess("mock_token", { name: formData.name || formData.email.split("@")[0], email: formData.email });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Back Button */}
      <button 
        onClick={() => onNavigate('')} 
        className="absolute top-6 left-6 flex items-center text-black hover:text-indigo-600 font-medium text-sm sm:text-base"
      >
        <ArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      {/* Form Card - Perfect Size */}
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm sm:text-base font-semibold text-indigo-600 mt-2">MCA Department • MXShare</p>
        </div>

        {/* Google Button */}
        <Button 
          onClick={() => googleLogin()} 
          variant="secondary" 
          className="w-full text-sm sm:text-base py-5 mb-6"
          disabled={isLoading}
        >
          Continue with College Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="bg-white px-3 text-gray-600 font-medium">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-center text-sm">
              {error}
            </div>
          )}

          {!isLogin && (
            <input
              id="name"
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base"
            />
          )}

          <input
            id="email"
            type="email"
            placeholder="25MX343@psgtech.ac.in"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base"
          />

          <input
            id="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base"
          />

          {!isLogin && (
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base"
            />
          )}

          {/* Login = Blue | Sign Up = Purple */}
          <Button 
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold py-3 rounded-lg text-white transition transform hover:scale-105 ${
              isLogin 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isLoading ? "Please wait..." : (isLogin ? "Login" : "Sign Up")}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-700">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button 
            onClick={() => onNavigate(isLogin ? "signup" : "login")}
            className="font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;