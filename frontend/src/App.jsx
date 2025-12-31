import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// The main App component that sets up routing for the GymFlex application
export default function App() {
  return (
    // BrowserRouter provides the routing context to the entire app
    <BrowserRouter>
      {/* Routes defines all the possible routes for the app */}
      <Routes>
        {/* 
          Home route ("/") is protected. 
          Only accessible if the user is authenticated via ProtectedRoute.
        */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Login page route */}
        <Route path="/login" element={<Login />} />

        {/* Register page route */}
        <Route path="/register" element={<Register />} />

        {/* Catch-all route for any undefined paths. Shows NotFound page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
