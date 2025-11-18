import React, { useEffect, useState } from "react";
import api from "../api"; // your axios instance
import { ACCESS_TOKEN } from "../constants";

export default function Timetable() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                // Get JWT token from localStorage
                const token = localStorage.getItem(ACCESS_TOKEN);

                // Fetch sessions from backend with authentication
                const res = await api.get("/sessions/", {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include token in request header
                    },
                });

                // Save sessions in state
                setSessions(res.data);
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                // Stop loading indicator
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    // Show loading message while fetching data
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
                            {/* Display session details: title, trainer, date and time */}
                            {session.title} — {session.trainer_username} — {session.date} {session.time}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
