// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const [valid, setValid] = useState(null); // null = checking, true = ok, false = invalid

    // If there's no token at all, immediately redirect to login
    if (!token) return <Navigate to="/login" replace />;

    useEffect(() => {
        let mounted = true;
        // Validate token by calling /users/me/
        api.get("/users/me/")
            .then(() => {
                if (mounted) setValid(true);
            })
            .catch(() => {
                // Token invalid/expired — clear and force login
                localStorage.removeItem(ACCESS_TOKEN);
                localStorage.removeItem(REFRESH_TOKEN);
                if (mounted) setValid(false);
            });

        return () => { mounted = false; };
    }, []);

    // While checking, render nothing (avoids flashing protected content)
    if (valid === null) return null;

    if (!valid) return <Navigate to="/login" replace />;

    return children;
}
