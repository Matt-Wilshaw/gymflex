// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

const localizer = momentLocalizer(moment);

const Home = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [activityFilter, setActivityFilter] = useState("");
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("currentUser");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const token = localStorage.getItem(ACCESS_TOKEN) || "";

    useEffect(() => {
        if (!token) {
            navigate("/login");
        } else {
            fetchSessions();
            if (!currentUser) fetchCurrentUser();
        }
    }, [token, navigate, currentUser]);

    const fetchSessions = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/sessions/", {
                headers: { Authorization: `Bearer ${token}` },
            });

            let filtered = res.data;
            if (activityFilter !== "") {
                filtered = filtered.filter((s) => s.activity_type === activityFilter);
            }

            const events = filtered.map((s) => ({
                id: s.id,
                // Format: ACTIVITY - Slots left - HH:MM
                title: `${s.activity_type.toUpperCase()} - Slots: ${s.available_slots} - ${s.time.slice(0, 5)}`,
                start: new Date(`${s.date}T${s.time}`),
                end: new Date(`${s.date}T${s.time}`),
                booked: s.booked,
                raw: s,
            })) || [];

            setSessions(events);
        } catch (err) {
            console.error("Error fetching sessions:", err);
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/users/me/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(res.data);
            localStorage.setItem("currentUser", JSON.stringify(res.data));
        } catch (err) {
            console.error("Error fetching current user:", err);
        }
    };

    const handleBook = async (session) => {
        try {
            const res = await axios.post(
                `http://localhost:8000/api/sessions/${session.id}/book/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Booking status: ${res.data.status}`);
            fetchSessions();
        } catch (err) {
            alert(err.response?.data?.status || "Booking failed");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("currentUser");
        navigate("/login");
    };

    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.booked ? "#dc3545" : "#198754",
            color: "white",
            borderRadius: "5px",
            border: "none",
            padding: "2px",
        };
        return { style };
    };

    return (
        <div className="container mt-4">
            {/* Header with welcome message, logout, and admin button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2>GymFlex Calendar</h2>
                    {currentUser && (
                        <h4 className="mt-1">Welcome, {currentUser.username}!</h4>
                    )}
                </div>
                <div>
                    {currentUser?.is_superuser && (
                        <button
                            className="btn btn-primary me-2"
                            onClick={() => window.open("http://127.0.0.1:8000/admin/", "_blank")}
                        >
                            Admin Panel
                        </button>
                    )}
                    <button className="btn btn-warning" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Activity Filter */}
            <div className="mb-3">
                <label>Filter by Activity: </label>
                <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="form-select w-25 d-inline-block ms-2"
                >
                    <option value="">All</option>
                    <option value="cardio">Cardio</option>
                    <option value="weights">Weightlifting</option>
                    <option value="yoga">Yoga</option>
                    <option value="hiit">HIIT</option>
                    <option value="pilates">Pilates</option>
                </select>
            </div>

            {/* Calendar */}
            <div style={{ height: 600 }}>
                <Calendar
                    localizer={localizer}
                    events={sessions}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={(event) => handleBook(event.raw)}
                />
            </div>

            <p className="mt-3">
                Click on a session in the calendar to <strong>book/unbook</strong> it.
            </p>
        </div>
    );
};

export default Home;
