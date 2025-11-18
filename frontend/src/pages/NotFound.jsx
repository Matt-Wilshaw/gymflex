// src/pages/NotFound.jsx
import React from "react";

// NotFound component displayed when the user navigates to an undefined route
export default function NotFound() {
    return (
        // Container div with padding for spacing
        <div style={{ padding: "20px" }}>
            {/* Page heading indicating a 404 error */}
            <h1>404 - Page Not Found</h1>

            {/* Informative message to the user */}
            <p>The page you are looking for does not exist.</p>
        </div>
    );
}
