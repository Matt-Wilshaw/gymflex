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
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);
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
                title: s.time.slice(0, 5),
                start: new Date(`${s.date}T${s.time}`),
                end: new Date(`${s.date}T${s.time}`),
                booked: s.booked,
                raw: s,
            })) || [];

            setSessions(events);
        } catch (err) {
            console.error("Error fetching sessions:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                alert("Failed to load sessions. Please try refreshing the page.");
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
            if (err.response?.status === 401) {
                handleLogout();
            }
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
            await fetchSessions();
        } catch (err) {
            const errorMsg = err.response?.data?.status || err.response?.data?.error || "Booking failed. Please try again.";
            alert(errorMsg);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("currentUser");
        navigate("/login");
    };

    const handleDrillDown = (date) => {
        const dateStr = moment(date).format("YYYY-MM-DD");
        const eventsForDate = sessions.filter(s =>
            moment(s.start).format("YYYY-MM-DD") === dateStr
        );

        if (eventsForDate.length > 0) {
            setModalDate(date);
            setModalEvents(eventsForDate);
            setShowModal(true);
        }
        return false;
    };

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

    const customDayPropGetter = (date) => {
        const dateStr = moment(date).format("YYYY-MM-DD");
        const dayEvents = sessions.filter(s =>
            moment(s.start).format("YYYY-MM-DD") === dateStr
        );

        if (dayEvents.length === 0) return {};

        const activityTypes = [...new Set(dayEvents.map(e => e.raw.activity_type))];
        const emojis = activityTypes.map(type => getActivityEmoji(type)).join(" ");

        return {
            style: {
                position: "relative"
            },
            children: (
                <div style={{
                    position: "absolute",
                    bottom: "2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "14px",
                    pointerEvents: "none",
                    whiteSpace: "nowrap"
                }}>
                    {emojis}
                </div>
            )
        };
    };

    return (
        <div className="container mt-4">
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

            <style>
                {`
                    .rbc-show-more {
                        cursor: pointer !important;
                        pointer-events: auto !important;
                        text-decoration: none !important;
                        color: #007bff !important;
                        font-weight: 600 !important;
                        font-size: 12px !important;
                        padding: 4px 8px !important;
                        background-color: #e7f3ff !important;
                        border-radius: 6px !important;
                        display: inline-block !important;
                        margin-top: 2px !important;
                    }
                    .rbc-show-more:hover {
                        background-color: #cce5ff !important;
                        color: #0056b3 !important;
                    }
                    .rbc-event {
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .rbc-date-cell {
                        padding-top: 4px !important;
                    }
                `}
            </style>
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

            <p className="mt-3">
                <strong>🟢 Green</strong> = Available to book | <strong>🔴 Red</strong> = Already booked | Click any day to see all sessions
                <br />
                <small>Activity icons: 🏃 Cardio | 🏋️ Weights | 🧘 Yoga | ⚡ HIIT | 🤸 Pilates</small>
            </p>

            {showModal && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1040,
                            animation: "fadeIn 0.2s ease-in"
                        }}
                        onClick={() => setShowModal(false)}
                    />

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
                            flexDirection: "column",
                            animation: "slideUp 0.3s ease-out"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            padding: "20px",
                            borderBottom: "2px solid #f0f0f0",
                            backgroundColor: "#f8f9fa",
                            borderTopLeftRadius: "14px",
                            borderTopRightRadius: "14px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexShrink: 0
                        }}>
                            <div>
                                <h5 style={{ margin: 0, fontWeight: "600", fontSize: "18px" }}>
                                    📅 Sessions
                                </h5>
                                <small style={{ color: "#666" }}>
                                    {modalDate && moment(modalDate).format("MMMM D, YYYY")}
                                </small>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    padding: "0",
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#666",
                                    borderRadius: "6px",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#e9ecef";
                                    e.currentTarget.style.color = "#000";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#666";
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{
                            padding: "16px",
                            overflowY: "auto",
                            flex: 1
                        }}>
                            {modalEvents.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                                    No sessions available on this day.
                                </p>
                            ) : (
                                modalEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        style={{
                                            backgroundColor: event.booked ? "#fff5f5" : "#f0fdf4",
                                            border: event.booked ? "2px solid #dc3545" : "2px solid #198754",
                                            borderRadius: "12px",
                                            padding: "16px",
                                            marginBottom: "12px",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            height: "90px",
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                        onClick={() => handleBook(event.raw)}
                                    >
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: "100%"
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontWeight: "600",
                                                    fontSize: "16px",
                                                    marginBottom: "6px",
                                                    color: "#1a1a1a",
                                                    lineHeight: "1.2"
                                                }}>
                                                    {event.raw.activity_type.toUpperCase()}
                                                </div>
                                                <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.2" }}>
                                                    🕐 {event.raw.time.slice(0, 5)}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right", width: "100px" }}>
                                                <div
                                                    style={{
                                                        backgroundColor: "#6c757d",
                                                        color: "white",
                                                        fontSize: "13px",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        display: "inline-block",
                                                        marginBottom: "6px"
                                                    }}
                                                >
                                                    {event.raw.available_slots} slots
                                                </div>
                                                <div style={{
                                                    fontSize: "13px",
                                                    color: event.booked ? "#dc3545" : "transparent",
                                                    fontWeight: "600",
                                                    height: "20px",
                                                    lineHeight: "20px"
                                                }}>
                                                    {event.booked ? "✓ Booked" : "\u00A0"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <style>
                        {`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes slideUp {
                                from { 
                                    transform: translate(-50%, -45%);
                                    opacity: 0;
                                }
                                to { 
                                    transform: translate(-50%, -50%);
                                    opacity: 1;
                                }
                            }
                        `}
                    </style>
                </>
            )}
        </div>
    );
};

export default Home;