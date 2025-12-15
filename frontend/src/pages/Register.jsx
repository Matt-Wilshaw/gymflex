// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

// Register component handles user registration for GymFlex
const Register = () => {
    // State variables for the form fields
    const [username, setUsername] = useState(""); // Username input
    const [password, setPassword] = useState(""); // Password input
    const [confirmPassword, setConfirmPassword] = useState(""); // Confirm Password input
    const [error, setError] = useState(""); // Error message state
    const [loading, setLoading] = useState(false); // Loading state to indicate form submission

    const navigate = useNavigate(); // Hook to programmatically navigate between routes

    // Prevent body scroll on register page
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    // Function called when the form is submitted
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behaviour
        setLoading(true); // Set loading state to true during API call
        setError(""); // Reset error message

        // Validate that password and confirm password fields match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            // Make POST request to Django backend register endpoint
            const res = await api.post("/register/", { username, password });

            // Store access and refresh tokens in local storage
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

            navigate("/"); // Redirect user to home page on successful registration
        } catch (err) {
            // Set error message if registration fails
            setError("Registration failed. Username may already exist.");
        } finally {
            setLoading(false); // Reset loading state after request completes
        }
    };

    return (
        // Container div for centring the form and setting max width
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(120deg, #e0f7ff 0%, #ffffff 100%)",
            overflow: "auto",
            padding: "20px"
        }}>
            <div style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(52, 152, 219, 0.15)",
                padding: "1.5rem",
                minWidth: "280px",
                maxWidth: "370px",
                width: "100%",
                textAlign: "center"
            }}>
                <img
                    src={import.meta.env.MODE === 'development' ? '/gymflex-logo.png' : '/static/gymflex-logo.png'}
                    alt="GymFlex logo"
                    style={{ height: 70, width: 70, objectFit: 'cover', marginBottom: 10, marginTop: 10, borderRadius: '50%', background: '#3498db' }}
                    onError={e => { e.target.onerror = null; e.target.src = import.meta.env.MODE === 'development' ? '/gymflex-logo.png' : '/static/gymflex-logo.png'; }}
                />
                <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 28, color: '#2c3e50', marginBottom: 10, letterSpacing: '1px' }}>GymFlex</div>
                <h2 style={{ marginBottom: 16, fontWeight: 700, color: "#2c3e50", fontSize: "1.5rem" }}>Register</h2>
                {/* Registration form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Username input */}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{ padding: "0.65rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 15 }}
                    />
                    {/* Password input */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ padding: "0.65rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 15 }}
                    />
                    {/* Confirm Password input */}
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: "0.65rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 15 }}
                    />
                    {/* Submit button */}
                    <button type="submit" disabled={loading} style={{
                        background: "linear-gradient(90deg, #3498db 0%, #2980b9 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "0.65rem",
                        fontWeight: 600,
                        fontSize: 16,
                        marginTop: 6,
                        cursor: loading ? "not-allowed" : "pointer"
                    }}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
                {/* Link to login page for users who already have an account */}
                <div style={{ marginTop: 14, fontSize: 14 }}>
                    <Link to="/login" style={{ color: "#3498db", textDecoration: "underline" }}>
                        Already have an account? Login
                    </Link>
                </div>
                {/* Error message display */}
                {error && <div style={{ color: "#dc3545", marginTop: 10, fontWeight: 500, fontSize: 13 }}>{error}</div>}
            </div>
        </div>
    );
};

export default Register;