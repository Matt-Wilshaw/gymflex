import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
    // Remove body scroll for 404 page
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

    return (
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
                maxWidth: "420px",
                width: "100%",
                textAlign: "center"
            }}>
                <img src="/favicons/favicon.svg" alt="GymFlex logo" style={{ height: 40, marginBottom: 12 }} />

                <div style={{
                    fontSize: "4rem",
                    fontWeight: 700,
                    color: "#3498db",
                    marginBottom: 12,
                    lineHeight: 1
                }}>
                    404
                </div>

                <h2 style={{
                    marginBottom: 12,
                    fontWeight: 700,
                    color: "#2c3e50",
                    fontSize: "1.5rem"
                }}>
                    Page Not Found
                </h2>

                <p style={{
                    color: "#666",
                    marginBottom: 20,
                    fontSize: 15,
                    lineHeight: 1.5
                }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <Link
                    to="/"
                    style={{
                        display: "inline-block",
                        background: "linear-gradient(90deg, #3498db 0%, #2980b9 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "0.65rem 1.5rem",
                        fontWeight: 600,
                        fontSize: 16,
                        textDecoration: "none",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(52, 152, 219, 0.3)";
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;