// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Home component displayed to authenticated users
export default function Home() {
    const navigate = useNavigate(); // Hook to programmatically navigate between routes

    // Function called when the user clicks the Logout button
    const handleLogout = () => {
        localStorage.clear(); // Clear all stored tokens from localStorage
        navigate("/login");   // Redirect user back to the login page
    };

    return (
        // Container div with centred text and margin at the top
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            {/* Page heading */}
            <h1>Welcome to GymFlex!</h1>
            {/* Informative text */}
            <p>You are logged in.</p>
            {/* Logout button */}
            <button onClick={handleLogout} style={{ padding: "10px 20px" }}>
                Logout
            </button>
        </div>
    );
}
