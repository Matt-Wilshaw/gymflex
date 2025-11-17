import React from 'react' // Import React library
import ReactDOM from 'react-dom/client' // Import ReactDOM for rendering to the DOM
import App from './App.jsx' // Import the main App component

// Create a root element and render the React app into it
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* StrictMode helps highlight potential problems in the app during development */}
    <App /> {/* Render the main App component */}
  </React.StrictMode>,
)
