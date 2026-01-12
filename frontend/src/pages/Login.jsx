import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [success, setSuccess] = useState("");
    const passwordRef = React.useRef(null);

    // Prevent body scroll on login page
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.overflow = 'hidden';

        // If navigated from registration, prefill username and show success
        if (location?.state?.username) {
            setUsername(location.state.username);
        }
        if (location?.state?.success) {
            setSuccess(location.state.success);
            // Clear success message after a short delay
            setTimeout(() => setSuccess(""), 5000);
        }

        // Focus password field when page loads
        setTimeout(() => passwordRef.current?.focus(), 100);

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/token/", { username, password });
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/");
        } catch (err) {
            setError("Invalid username or password");
        } finally {
            setLoading(false);
        }
    };

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
                <h2 style={{ marginBottom: 16, fontWeight: 700, color: "#2c3e50", fontSize: "1.5rem" }}>Login</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{ padding: "0.65rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 15 }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        ref={passwordRef}
                        required
                        style={{ padding: "0.65rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 15 }}
                    />
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
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <div style={{ marginTop: 14, fontSize: 14 }}>
                    <Link to="/register" style={{ color: "#3498db", textDecoration: "underline" }}>
                        Don't have an account? Register
                    </Link>
                </div>
                {success && <div style={{ color: "#155724", background: '#d4edda', padding: '8px', borderRadius: 8, marginTop: 10 }}>{success}</div>}
                {error && <div style={{ color: "#dc3545", marginTop: 10, fontWeight: 500, fontSize: 13 }}>{error}</div>}
            </div>
        </div>
    );
};

export default Login;