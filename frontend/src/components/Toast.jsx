import React from "react";

const Toast = ({ message, show, type = "info" }) => {
    if (!show) return null;
    let bg = "#333";
    if (type === "success") bg = "#198754";
    if (type === "error") bg = "#dc3545";
    return (
        <div style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: bg,
            color: "#fff",
            padding: "14px 32px",
            borderRadius: 24,
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            zIndex: 3000,
            opacity: show ? 1 : 0,
            transition: "opacity 0.3s"
        }}>
            {message}
        </div>
    );
};

export default Toast;
