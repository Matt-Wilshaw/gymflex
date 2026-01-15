// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Main App component containing all routes and pages
import { Toaster } from 'react-hot-toast';

// Create the root of the React application and render the App component
// Global error handlers to capture unhandled promise rejections and errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    try {
      // Log full rejection reason and stack for production debugging
      // eslint-disable-next-line no-console
      console.error('Unhandled promise rejection captured:', e.reason);
    } catch (_) {}
  });

  window.addEventListener('error', (err) => {
    try {
      // eslint-disable-next-line no-console
      console.error('Global error captured:', err.error || err.message, err.filename, err.lineno, err.colno);
    } catch (_) {}
  });
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Toaster rendered at app root so it's not affected by local stacking contexts */}
    <Toaster position="top-center" containerStyle={{ zIndex: 100000 }} />
    <App />
  </React.StrictMode>,
);
