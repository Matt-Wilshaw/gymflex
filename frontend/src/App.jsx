import React from "react" // Import React
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom" // Import routing components
import Login from "./pages/Login" // Login page component
import Register from "./pages/Register" // Register page component
import Home from "./pages/Home" // Home page component
import NotFound from "./pages/NotFound" // 404 page component
import ProtectedRoute from "./components/ProtectedRoute" // Component to protect routes that need login

// Logout component: clears localStorage and redirects to login page
function Logout() {
  localStorage.clear() // Remove all stored data (like JWT token)
  return <Navigate to="/login" /> // Redirect user to login
}

// RegisterAndLogout component: clears localStorage before showing the Register page
function RegisterAndLogout() {
  localStorage.clear() // Remove any existing stored data
  return <Register /> // Render Register page
}

function App() {
  return (
    <BrowserRouter> {/* Wrap the app in BrowserRouter to enable routing */}
      <Routes> {/* Define all routes for the app */}
        {/* Home route, protected by ProtectedRoute */}
        <Route
          path="/"
          element={
            <ProtectedRoute> {/* Only allows access if user is logged in */}
              <Home /> {/* Render Home page */}
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} /> {/* Login page route */}
        <Route path="/logout" element={<Logout />} /> {/* Logout route */}
        <Route path="/register" element={<RegisterAndLogout />} /> {/* Register page with auto logout */}
        <Route path="*" element={<NotFound />}></Route> {/* Catch-all route for unknown paths */}
      </Routes>
    </BrowserRouter>
  )
}

export default App // Export App component as default
