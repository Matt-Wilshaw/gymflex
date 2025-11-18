import React, { useEffect, useState } from "react";
import api from "../api"; // your axios instance
import { ACCESS_TOKEN } from "../constants";

export default function Timetable() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await api.get("/sessions/"); // backend endpoint for sessions
                setSessions(res.data);
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    if (loading) return <p>Loading timetable...</p>;

    return (
        <div style={{ maxWidth: "600px", margin: "20px auto" }}>
            <h2>Gym Sessions</h2>
            {sessions.length === 0 ? (
                <p>No sessions available.</p>
            ) : (
                <ul>
                    {sessions.map((session) => (
                        <li key={session.id}>
                            {session.title} — {session.trainer.username} — {session.date} {session.time}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
