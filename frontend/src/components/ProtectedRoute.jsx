// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants.js";

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem(ACCESS_TOKEN);

    // If no token, redirect to login
    if (!token) return <Navigate to="/login" replace />;

    // Otherwise, render the page
    return children;
}
