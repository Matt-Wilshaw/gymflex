// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Main App component containing all routes and pages
import { Toaster } from 'react-hot-toast';

// Create the root of the React application and render the App component
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Toaster rendered at app root so it's not affected by local stacking contexts */}
    <Toaster position="top-center" containerStyle={{ zIndex: 100000 }} />
    <App />
  </React.StrictMode>,
);
