// src/pages/Home.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import api from "../api";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

const localizer = momentLocalizer(moment);

const Home = () => {
    const navigate = useNavigate();

    // Calendar data
    const [sessions, setSessions] = useState([]);
    const [activityFilter, setActivityFilter] = useState("");

    // Modal data
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);

    // Current user
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("currentUser");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Booked sessions for the current user (fetched without activity filter)
    const [bookedSessions, setBookedSessions] = useState([]);

    const token = localStorage.getItem(ACCESS_TOKEN) || "";

    useEffect(() => {
        if (!token) {
            navigate("/login");
        } else {
            fetchSessions();
            if (!currentUser) fetchCurrentUser();
            // always refresh booked sessions (independent of activityFilter)
            fetchBookedSessions();
        }
    }, [token, navigate, currentUser]);

    // Fetch sessions (returns the filtered sessions array)
    const fetchSessions = async () => {
        try {
            const res = await api.get(`/sessions/`);

            let filtered = res.data;
            if (activityFilter) {
                filtered = filtered.filter((s) => s.activity_type === activityFilter);
            }

            // Store raw sessions only, we don't need default events
            setSessions(filtered);
            return filtered;
        } catch (err) {
            console.error("Error fetching sessions:", err);
            if (err.response?.status === 401) handleLogout();
            else alert("Failed to load sessions. Please refresh.");
            return [];
        }
    };

    // Fetch sessions and return only those the current user has booked
    const fetchBookedSessions = async () => {
        try {
            const res = await api.get(`/sessions/`);

            // Backend serializer exposes `booked` for the requesting user
            const userBooked = res.data.filter((s) => s.booked === true);
            setBookedSessions(userBooked);
            return userBooked;
        } catch (err) {
            console.error("Error fetching booked sessions:", err);
            return [];
        }
    };

    // Fetch current user
    const fetchCurrentUser = async () => {
        try {
            const res = await api.get(`/users/me/`);
            setCurrentUser(res.data);
            localStorage.setItem("currentUser", JSON.stringify(res.data));
        } catch (err) {
            console.error("Error fetching user:", err);
            if (err.response?.status === 401) handleLogout();
        }
    };

    // Book a session
    const handleBook = async (session) => {
        try {
            const res = await api.post(`/sessions/${session.id}/book/`);
            alert(`Booking status: ${res.data.status}`);
            // Refresh sessions and update modal contents if modal is open for the same date
            const refreshed = await fetchSessions();
            // Also refresh booked sessions list for the user so "My Bookings" updates immediately
            await fetchBookedSessions();
            if (showModal && modalDate) {
                const dateStr = moment(modalDate).format("YYYY-MM-DD");
                const eventsForDate = refreshed.filter(
                    (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
                );
                setModalEvents(eventsForDate);
            }
        } catch (err) {
            const errorMsg =
                err.response?.data?.status ||
                err.response?.data?.error ||
                "Booking failed. Please try again.";
            alert(errorMsg);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("currentUser");
        navigate("/login");
    };

    // Clicking a day → show modal with all sessions that day
    const handleDrillDown = (date) => {
        const dateStr = moment(date).format("YYYY-MM-DD");
        const eventsForDate = sessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );
        if (eventsForDate.length > 0) {
            setModalDate(date);
            setModalEvents(eventsForDate);
            setShowModal(true);
        }
        return false;
    };

    // Map activity type to emoji
    const getActivityEmoji = (activityType) => {
        const emojis = {
            cardio: "🏃",
            weights: "🏋️",
            yoga: "🧘",
            hiit: "⚡",
            pilates: "🤸",
        };
        return emojis[activityType] || "💪";
    };

    // Date cell wrapper: render unique emojis for the day.
    // Uses sessions (and current activityFilter) to compute the day's activities.
    const DateCellWrapper = ({ children, value }) => {
        const dateStr = moment(value).format("YYYY-MM-DD");

        // Apply activityFilter client-side so the calendar icons reflect the selected filter
        const displayedSessions = activityFilter
            ? sessions.filter((s) => s.activity_type === activityFilter)
            : sessions;

        const dayEvents = displayedSessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );

        // Render a full-size container so absolute positioning aligns with the calendar cell
        const containerStyle = {
            position: "relative",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
        };

        if (dayEvents.length === 0) return <div style={containerStyle}>{children}</div>;

        // Unique activity types for the day
        const uniqueActivities = [...new Set(dayEvents.map((e) => e.activity_type))];

        // The button is absolutely positioned at the bottom center of the cell.
        // It replaces the emoji bar and opens the day's modal when clicked.
        const buttonStyle = {
            position: "absolute",
            bottom: 6,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 12,
            pointerEvents: "auto",
            cursor: "pointer",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "inline-block",
            textAlign: "center",
            borderRadius: 8,
            padding: "4px 8px",
            border: "1px solid rgba(0,0,0,0.1)",
            background: "#0d6efd",
            color: "white",
        };

        // Wrap children in a container that will take available space so the button aligns to the bottom
        const contentWrapperStyle = {
            display: "flex",
            flexDirection: "column",
            height: "100%",
        };

        const countText = `${dayEvents.length} ${dayEvents.length === 1 ? "session" : "sessions"}`;
        const emojis = uniqueActivities.map(getActivityEmoji).join(" ");

        // Emoji bar style (placed above the button)
        const emojiBarStyle = {
            position: "absolute",
            bottom: 36, // place just above the button (button bottom is 6)
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 14,
            pointerEvents: "auto",
            whiteSpace: "nowrap",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "inline-block",
            textAlign: "center",
            background: "transparent",
        };

        // Button content only shows the count (no emojis)
        const buttonContent = <span>{countText}</span>;

        const buttonStyleWithFlex = {
            ...buttonStyle,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
        };

        return (
            <div style={containerStyle}>
                <div style={contentWrapperStyle}>{children}</div>
                <div style={emojiBarStyle} title={uniqueActivities.join(", ")}>
                    {emojis}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDrillDown(value);
                    }}
                    style={buttonStyleWithFlex}
                    title={uniqueActivities.join(", ")}
                >
                    {buttonContent}
                </button>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2>GymFlex Calendar</h2>
                    {currentUser && <h4 className="mt-1">Welcome, {currentUser.username}!</h4>}
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

            {/* Activity filter */}
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
                    events={[]} // Don't render default events
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    onDrillDown={handleDrillDown}
                    views={["month"]}
                    components={{ event: () => null, dateCellWrapper: DateCellWrapper }} // Hide default events and render date wrapper
                />
            </div>

            <p className="mt-3">
                <strong>Click a day to view sessions in the modal.</strong>
                <br />
                <small>
                    Activity icons: 🏃 Cardio | 🏋️ Weights | 🧘 Yoga | ⚡ HIIT | 🤸 Pilates
                </small>
            </p>

            <div className="mb-4">
                <h5>My Bookings</h5>
                {bookedSessions.length === 0 ? (
                    <p style={{ color: "#666" }}>You have no bookings yet.</p>
                ) : (
                    <ul>
                        {bookedSessions.map((s) => (
                            <li key={s.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <strong>{s.activity_type.toUpperCase()}</strong>
                                    {' — '}
                                    {moment(s.date).format("MMMM D, YYYY")} @ {s.time.slice(0, 5)}
                                    {s.available_slots !== undefined && (
                                        <span style={{ marginLeft: 8, color: "#666" }}>({s.available_slots} slots)</span>
                                    )}
                                </div>
                                <div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBook(s);
                                        }}
                                        style={{
                                            marginLeft: 12,
                                            padding: '6px 10px',
                                            fontSize: 12,
                                            borderRadius: 6,
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: '#dc3545',
                                            color: 'white',
                                            cursor: 'pointer',
                                        }}
                                        title="Cancel booking"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
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
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h5 style={{ margin: 0 }}>📅 Sessions</h5>
                                <small>{modalDate && moment(modalDate).format("MMMM D, YYYY")}</small>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", padding: 0 }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal content */}
                        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                            {modalEvents.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#666" }}>No sessions available on this day.</p>
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
                                        }}
                                        onClick={() => handleBook(event)}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "600", fontSize: "16px" }}>
                                                    {event.activity_type.toUpperCase()}
                                                </div>
                                                <div style={{ color: "#666" }}>🕐 {event.time.slice(0, 5)}</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div
                                                    style={{
                                                        backgroundColor: "#6c757d",
                                                        color: "white",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                    }}
                                                >
                                                    {event.available_slots} slots
                                                </div>
                                                <div style={{ color: event.booked ? "#dc3545" : "transparent", fontWeight: "600" }}>
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
