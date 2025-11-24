// src/pages/Home.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

// Setup the calendar localizer using Moment.js
const localizer = momentLocalizer(moment);

const Home = () => {
    const navigate = useNavigate();

    // Stores all sessions from the backend (formatted as calendar events)
    const [sessions, setSessions] = useState([]);

    // Activity dropdown filter
    const [activityFilter, setActivityFilter] = useState("");

    // Modal visibility and data
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);

    // Retrieve current user from localStorage (cached between reloads)
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("currentUser");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // JWT token
    const token = localStorage.getItem(ACCESS_TOKEN) || "";

    // On load: ensure token exists, get sessions + current user
    useEffect(() => {
        if (!token) {
            navigate("/login"); // Redirect if not logged in
        } else {
            fetchSessions();
            if (!currentUser) fetchCurrentUser();
        }
    }, [token, navigate, currentUser]);

    // Fetch all sessions and format them for the calendar
    const fetchSessions = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/sessions/", {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Apply activity filter if selected
            let filtered = res.data;
            if (activityFilter !== "") {
                filtered = filtered.filter((s) => s.activity_type === activityFilter);
            }

            // Convert backend session objects into react-big-calendar event format
            const events = filtered.map((s) => ({
                id: s.id,
                title: s.time.slice(0, 5), // Shown inside calendar box
                start: new Date(`${s.date}T${s.time}`),
                end: new Date(`${s.date}T${s.time}`),
                booked: s.booked,
                raw: s, // Store full original session
            })) || [];

            setSessions(events);
        } catch (err) {
            console.error("Error fetching sessions:", err);

            if (err.response?.status === 401) {
                handleLogout(); // Token expired
            } else {
                alert("Failed to load sessions. Please try refreshing the page.");
            }
        }
    };

    // Fetch the currently logged-in user's profile
    const fetchCurrentUser = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/users/me/", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCurrentUser(res.data);
            localStorage.setItem("currentUser", JSON.stringify(res.data));
        } catch (err) {
            console.error("Error fetching current user:", err);
            if (err.response?.status === 401) handleLogout();
        }
    };

    // Book a session ( clicking an event triggers this )
    const handleBook = async (session) => {
        try {
            const res = await axios.post(
                `http://localhost:8000/api/sessions/${session.id}/book/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`Booking status: ${res.data.status}`);
            await fetchSessions(); // Refresh calendar
        } catch (err) {
            const errorMsg =
                err.response?.data?.status ||
                err.response?.data?.error ||
                "Booking failed. Please try again.";

            alert(errorMsg);
        }
    };

    // Fully logs the user out
    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("currentUser");
        navigate("/login");
    };

    // When clicking a day on the calendar → open modal showing all sessions for that date
    const handleDrillDown = (date) => {
        const dateStr = moment(date).format("YYYY-MM-DD");

        const eventsForDate = sessions.filter(
            (s) => moment(s.start).format("YYYY-MM-DD") === dateStr
        );

        if (eventsForDate.length > 0) {
            setModalDate(date);
            setModalEvents(eventsForDate);
            setShowModal(true);
        }

        return false; // Prevent default drilldown behaviour
    };

    // Style each event (green = available, red = booked)
    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.booked ? "#dc3545" : "#198754",
            color: "white",
            borderRadius: "6px",
            border: "none",
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: "600",
            textAlign: "center",
        };
        return { style };
    };

    // Maps activity types to little emoji icons
    const getActivityEmoji = (activityType) => {
        const emojis = {
            cardio: "🏃",
            weights: "🏋️",
            yoga: "🧘",
            hiit: "⚡",
            pilates: "🤸"
        };
        return emojis[activityType] || "💪";
    };

    // Shows an emoji icon in the bottom of each calendar day
    const customDayPropGetter = (date) => {
        const dateStr = moment(date).format("YYYY-MM-DD");

        const dayEvents = sessions.filter(
            (s) => moment(s.start).format("YYYY-MM-DD") === dateStr
        );

        if (dayEvents.length === 0) return {};

        // Unique activity types (to avoid duplicates)
        const activityTypes = [...new Set(dayEvents.map((e) => e.raw.activity_type))];
        const emojis = activityTypes.map((type) => getActivityEmoji(type)).join(" ");

        return {
            style: { position: "relative" },
            children: (
                <div
                    style={{
                        position: "absolute",
                        bottom: "2px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "14px",
                        pointerEvents: "none"
                    }}
                >
                    {emojis}
                </div>
            )
        };
    };

    // ------------------ JSX RETURN SECTION ------------------
    return (
        <div className="container mt-4">

            {/* Header + welcome message */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2>GymFlex Calendar</h2>
                    {currentUser && (
                        <h4 className="mt-1">Welcome, {currentUser.username}!</h4>
                    )}
                </div>

                {/* Admin panel button + Logout */}
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

            {/* Activity dropdown filter */}
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

            {/* Calendar container */}
            <div style={{ height: 600, position: "relative" }}>
                <Calendar
                    localizer={localizer}
                    events={sessions}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    eventPropGetter={eventStyleGetter}
                    dayPropGetter={customDayPropGetter}
                    onSelectEvent={(event) => handleBook(event.raw)}
                    onDrillDown={handleDrillDown}
                />
            </div>

            {/* Legend */}
            <p className="mt-3">
                <strong>🟢 Green</strong> = Available to book | <strong>🔴 Red</strong> = Already booked
                <br />
                <small>Activity icons: 🏃 Cardio | 🏋️ Weights | 🧘 Yoga | ⚡ HIIT | 🤸 Pilates</small>
            </p>

            {/* Modal section (sessions on selected day) */}
            {showModal && (
                <>
                    {/* Background overlay */}
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)"
                        }}
                        onClick={() => setShowModal(false)}
                    />

                    {/* Modal box */}
                    <div
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                            zIndex: 1050,
                            width: "90%",
                            maxWidth: "500px",
                            maxHeight: "80vh",
                            display: "flex",
                            flexDirection: "column"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div
                            style={{
                                padding: "20px",
                                borderBottom: "2px solid #f0f0f0",
                                backgroundColor: "#f8f9fa",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <div>
                                <h5 style={{ margin: 0 }}>📅 Sessions</h5>
                                <small>{modalDate && moment(modalDate).format("MMMM D, YYYY")}</small>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    padding: 0
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal content */}
                        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                            {modalEvents.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#666" }}>
                                    No sessions available on this day.
                                </p>
                            ) : (
                                modalEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        style={{
                                            backgroundColor: event.booked ? "#fff5f5" : "#f0fdf4",
                                            border: event.booked
                                                ? "2px solid #dc3545"
                                                : "2px solid #198754",
                                            borderRadius: "12px",
                                            padding: "16px",
                                            marginBottom: "12px",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => handleBook(event.raw)}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "600", fontSize: "16px" }}>
                                                    {event.raw.activity_type.toUpperCase()}
                                                </div>
                                                <div style={{ color: "#666" }}>
                                                    🕐 {event.raw.time.slice(0, 5)}
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right" }}>
                                                <div
                                                    style={{
                                                        backgroundColor: "#6c757d",
                                                        color: "white",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px"
                                                    }}
                                                >
                                                    {event.raw.available_slots} slots
                                                </div>

                                                {/* Booked indicator */}
                                                <div
                                                    style={{
                                                        color: event.booked ? "#dc3545" : "transparent",
                                                        fontWeight: "600"
                                                    }}
                                                >
                                                    {event.booked ? "✓ Booked" : ""}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
