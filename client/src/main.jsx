import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import './index.css'; 
import { ThemeProvider } from './context/ThemeContext'; // Import context

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* 1. Wrap the entire App in ThemeProvider */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Check index.html");
}