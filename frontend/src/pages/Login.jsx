import React, { useState } from "react";
import api from "../api"; // Axios instance configured for Django backend
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js"; // Keys for storing JWT tokens
import { useNavigate } from "react-router-dom";

// Login component allows existing users to authenticate and access the app
export default function Login() {
    // State variables for input fields and loading state
    const [username, setUsername] = useState(""); // Stores username input
    const [password, setPassword] = useState(""); // Stores password input
    const [loading, setLoading] = useState(false); // Tracks whether login request is in progress

    const navigate = useNavigate(); // Hook to programmatically navigate between routes

    // Function called when the login form is submitted
    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission behaviour
        setLoading(true); // Set loading state to true while waiting for API response

        try {
            // Send POST request to backend token endpoint with username and password
            const res = await api.post("/token/", { username, password });

            // Check if response contains data
            if (res && res.data) {
                // Store JWT tokens in localStorage for authenticated requests
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

                // Redirect user to Home page
                navigate("/");
            } else {
                alert("Login failed: no response data"); // Alert if response is missing
            }
        } catch (err) {
            console.error("Login error:", err); // Log error for debugging
            // Show detailed message if available, otherwise a generic error
            alert(
                "Login failed: " +
                (err.response?.data?.detail || err.message || "Unknown error")
            );
        } finally {
            setLoading(false); // Reset loading state once request is complete
        }
    };

    return (
        // Container div to centre the form and set max width
        <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
            <h1>Login</h1>
            {/* Login form */}
            <form onSubmit={handleLogin}>
                {/* Username input */}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                {/* Password input */}
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                {/* Submit button */}
                <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
