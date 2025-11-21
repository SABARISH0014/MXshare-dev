import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Imports your AppWrapper
import './index.css';    // Imports global styles

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
      <App />
  );
} else {
  console.error("Failed to find the root element. Check index.html");
}