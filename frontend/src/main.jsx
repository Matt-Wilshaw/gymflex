// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Main App component containing all routes and pages

// Create the root of the React application and render the App component
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
      React.StrictMode is a development tool that highlights potential problems
      in the application. It does not affect production build behaviour.
    */}
    <App />
  </React.StrictMode>,
);
