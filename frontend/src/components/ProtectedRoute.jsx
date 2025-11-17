import { Navigate } from "react-router-dom" // Navigate allows redirecting to another route
import jwtDecode from "jwt-decode" // Decode JWT tokens to check expiration
import api from "../api" // Your API helper for making requests
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants" // Constants for localStorage keys
import { useState, useEffect } from "react" // React hooks

// ProtectedRoute component wraps routes that require authentication
function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null) // null = loading, true = allowed, false = not allowed

    // Run authentication check once when the component mounts
    useEffect(() => {
        auth().catch(() => setIsAuthorized(false)) // If auth fails, mark as unauthorized
    }, [])

    // Function to refresh the access token using the refresh token
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN) // Get refresh token from localStorage
        try {
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken, // Send refresh token to backend
            })
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access) // Store new access token
                setIsAuthorized(true) // User is now authorised
            } else {
                setIsAuthorized(false) // Refresh failed, user not authorised
            }
        } catch (error) {
            console.log(error) // Log any errors
            setIsAuthorized(false) // Mark user as not authorised
        }
    }

    // Main authentication function
    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN) // Get access token from localStorage
        if (!token) {
            setIsAuthorized(false) // No token, user not authorised
            return
        }

        const decoded = jwtDecode(token) // Decode JWT to check expiration
        const tokenExpiration = decoded.exp
        const now = Date.now() / 1000

        if (tokenExpiration < now) {
            await refreshToken() // Token expired → try to refresh
        } else {
            setIsAuthorized(true) // Token valid → user authorised
        }
    }

    // While we are checking the token, show a loading message
    if (isAuthorized === null) {
        return <div>Loading...</div>
    }

    // If authorised, render children (protected route)
    // If not authorised, redirect to /login
    return isAuthorized ? children : <Navigate to="/login" />
}

export default ProtectedRoute // Export component for use in App.jsx
