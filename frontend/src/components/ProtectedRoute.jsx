// Import Navigate for redirecting users to a different route
import { Navigate } from "react-router-dom";
// Import jwtDecode for decoding JWT tokens
import jwtDecode from "jwt-decode";
// Import your API helper for making HTTP requests
import api from "../api.js";
// Import constants for token storage keys
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants.js";
// Import React hooks for managing state and side effects
import { useState, useEffect } from "react";

// ProtectedRoute component ensures that children are only accessible if the user is authorised
function ProtectedRoute({ children }) {
    // State to track whether the user is authorised
    // null = still checking, true = authorised, false = not authorised
    const [isAuthorised, setIsAuthorised] = useState(null);

    // Run the authentication check once when the component mounts
    // If auth() fails for any reason, default to unauthorised
    useEffect(() => {
        auth().catch(() => setIsAuthorised(false));
    }, []);

    // Function to refresh the access token using the stored refresh token
    // This is called when the existing access token has expired
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);

        // If no refresh token exists, the user clearly isn't authorised
        if (!refreshToken) {
            setIsAuthorised(false);
            return;
        }

        try {
            // Attempt to request a new access token from the API
            const response = await api.post("/api/token/refresh/", {
                refresh: refreshToken
            });

            // If successful, store the new access token and confirm authorisation
            if (response.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                setIsAuthorised(true);
            } else {
                // Any unexpected status means the user cannot be authorised
                setIsAuthorised(false);
            }
        } catch (error) {
            // Log the error for debugging and mark the user as unauthorised
            console.log(error);
            setIsAuthorised(false);

            // NOTE: You may want to handle refreshing logic further here,
            // for example automatically logging the user out.
        }
    };

    // Function to check if the user is currently authenticated
    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);

        // If no access token exists, the user is not authenticated
        if (!token) {
            setIsAuthorised(false);
            return;
        }

        // Decode the token to check its expiry timestamp
        const decoded = jwtDecode(token);
        const tokenExpiry = decoded.exp;
        const now = Date.now() / 1000; // Current time in seconds

        // If the token has expired, attempt to refresh it
        if (tokenExpiry < now) {
            await refreshToken();
        } else {
            // If token is still valid, authorise the user
            setIsAuthorised(true);
        }

        // NOTE: You could add backend verification here if needed.
    };

    // While authorisation status is being determined, show a loading indicator
    if (isAuthorised === null) {
        return <div>Loading...</div>;
    }

    // If authorised, render the protected content
    // If not authorised, redirect the user to the login page
    return isAuthorised ? children : <Navigate to="/login" />;
}

// Export the component so it can be used in other parts of your app
export default ProtectedRoute;
