// src/pages/Register.jsx
import React, { useState } from "react";
import api from "../api"; // Axios instance to communicate with Django backend
import { useNavigate } from "react-router-dom";

// Register component handles user registration for GymFlex
export default function Register() {
    // State variables for the form fields
    const [username, setUsername] = useState(""); // Username input
    const [password, setPassword] = useState(""); // Password input
    const [password2, setPassword2] = useState(""); // Password confirmation input
    const [loading, setLoading] = useState(false); // Loading state to indicate form submission

    const navigate = useNavigate(); // Hook to programmatically navigate between routes

    // Function called when the form is submitted
    const handleRegister = async (e) => {
        e.preventDefault(); // Prevent default form submission behaviour

        // Check if passwords match
        if (password !== password2) {
            alert("Passwords do not match"); // Alert user if mismatch
            return;
        }

        setLoading(true); // Set loading state to true during API call

        try {
            // Make POST request to Django backend register endpoint
            const res = await api.post("/register/", { username, password });

            // If registration successful (HTTP 201)
            if (res.status === 201) {
                alert("Registration successful! You can now log in.");
                navigate("/login"); // Redirect user to login page
            } else {
                alert("Registration failed"); // Generic failure alert
            }
        } catch (err) {
            console.error("Register error:", err); // Log error for debugging
            // Show detailed message if available, otherwise a generic error
            alert(err.response?.data?.detail || err.message || "Registration failed");
        } finally {
            setLoading(false); // Reset loading state after request completes
        }
    };

    return (
        // Container div for centring the form and setting max width
        <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
            <h1>Register</h1>
            {/* Registration form */}
            <form onSubmit={handleRegister}>
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
                {/* Confirm password input */}
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                {/* Submit button */}
                <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
}
