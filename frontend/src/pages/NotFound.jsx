// src/pages/NotFound.jsx
import React from "react";

// NotFound component displayed when the user navigates to an undefined route
export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e3e6f3 100%)'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 2px 16px rgba(52,152,219,0.08)',
                padding: '40px 32px',
                textAlign: 'center',
                maxWidth: '350px',
                width: '100%'
            }}>
                <h1 style={{
                    color: '#3498db',
                    fontWeight: 700,
                    fontSize: '2.2rem',
                    marginBottom: '18px',
                    letterSpacing: '2px'
                }}>404</h1>
                <h2 style={{
                    color: '#2c3e50',
                    fontWeight: 600,
                    fontSize: '1.2rem',
                    marginBottom: '16px'
                }}>Page Not Found</h2>
                <p style={{
                    color: '#666',
                    fontSize: '1rem',
                    marginBottom: '10px'
                }}>
                    The page you are looking for does not exist.<br />
                    Please check the URL or return to the home page.
                </p>
                <a href="/" style={{
                    display: 'inline-block',
                    marginTop: '18px',
                    padding: '10px 24px',
                    background: '#3498db',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(52,152,219,0.08)',
                    transition: 'background 0.2s'
                }}>Go Home</a>
            </div>
        </div>
    );
}
