import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            background: "linear-gradient(135deg, #f3e6fa 0%, #e9d7f7 100%)"
        }}>
            <div style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(80, 50, 120, 0.10)",
                padding: "2.5rem 2.5rem 2rem 2.5rem",
                minWidth: 320,
                maxWidth: 370,
                width: "100%",
                textAlign: "center",
                overflow: "visible"
            }}>
                <img src="/favicons/favicon.svg" alt="GymFlex logo" style={{ height: 48, marginBottom: 12 }} />
                <h2 style={{ marginBottom: 18, fontWeight: 700, color: "#6c3fa7" }}>Login</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 16 }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 16 }}
                    />
                    <button type="submit" disabled={loading} style={{
                        background: "linear-gradient(90deg, #a084e8 0%, #6c3fa7 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "0.75rem",
                        fontWeight: 600,
                        fontSize: 17,
                        marginTop: 8,
                        cursor: loading ? "not-allowed" : "pointer"
                    }}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <div style={{ marginTop: 18, fontSize: 15 }}>
                    <Link to="/register" style={{ color: "#6c3fa7", textDecoration: "underline" }}>
                        Don't have an account? Register
                    </Link>
                </div>
                {error && <div style={{ color: "#dc3545", marginTop: 12, fontWeight: 500 }}>{error}</div>}
            </div>
        </div>
    );
};

export default Login;
