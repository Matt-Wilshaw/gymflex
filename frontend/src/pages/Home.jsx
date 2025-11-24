// src/pages/Home.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import api from "../api";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

const Home = () => {
    const navigate = useNavigate();

    // ------------------ STATE ------------------

    // All sessions to display in the calendar (filtered client-side)
    const [sessions, setSessions] = useState([]);
    // Currently selected activity filter from dropdown
    const [activityFilter, setActivityFilter] = useState("");

    // Modal visibility and content
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);

    // Current logged-in user information
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("currentUser");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Sessions booked by current user (for "My Bookings" list)
    const [bookedSessions, setBookedSessions] = useState([]);
    // Admin-only: full sessions list (unfiltered) so admins see every session and attendees
    const [adminSessions, setAdminSessions] = useState([]);
    // Admin selected date (YYYY-MM-DD). Default to today to minimize list.
    const [selectedAdminDate, setSelectedAdminDate] = useState(moment().format("YYYY-MM-DD"));
    const [adminLoading, setAdminLoading] = useState(false);

    // JWT token stored in localStorage
    const token = localStorage.getItem(ACCESS_TOKEN) || "";

    // ------------------ EFFECTS ------------------

    useEffect(() => {
        if (!token) {
            // Redirect to login if no token exists
            navigate("/login");
        } else {
            // Fetch all sessions and current user information
            fetchSessions();
            if (!currentUser) fetchCurrentUser();
            // Always refresh booked sessions for current user
            fetchBookedSessions();
            // If current user is admin we want to load the unfiltered sessions list
            if (currentUser?.is_staff) fetchAllSessions();
        }
    }, [token, navigate, currentUser]);

    // ------------------ API CALLS ------------------

    // Fetch sessions from backend; apply client-side activity filter
    const fetchSessions = async () => {
        try {
            const res = await api.get(`/sessions/`);

            let filtered = res.data;
            if (activityFilter) {
                filtered = filtered.filter((s) => s.activity_type === activityFilter);
            }

            // Save filtered sessions to state
            setSessions(filtered);
            return filtered;
        } catch (err) {
            console.error("Error fetching sessions:", err);
            if (err.response?.status === 401) handleLogout();
            else alert("Failed to load sessions. Please refresh.");
            return [];
        }
    };

    // Fetch only sessions booked by current user
    const fetchBookedSessions = async () => {
        try {
            const res = await api.get(`/sessions/`);

            // Filter sessions where booked is true for this user
            const userBooked = res.data.filter((s) => s.booked === true);
            setBookedSessions(userBooked);
            return userBooked;
        } catch (err) {
            console.error("Error fetching booked sessions:", err);
            return [];
        }
    };

    // Fetch unfiltered sessions for admins so they can see all bookings
    const fetchAllSessions = async () => {
        setAdminLoading(true);
        try {
            const res = await api.get(`/sessions/`);
            setAdminSessions(res.data);
            return res.data;
        } catch (err) {
            console.error("Error fetching all sessions:", err);
            return [];
        } finally {
            setAdminLoading(false);
        }
    };

    // Fetch currently logged-in user's profile
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

    // ------------------ HANDLERS ------------------

    // Handle booking/unbooking a session
    const handleBook = async (session) => {
        try {
            const res = await api.post(`/sessions/${session.id}/book/`);
            alert(`Booking status: ${res.data.status}`);

            // Refresh sessions and update modal if open
            const refreshed = await fetchSessions();
            await fetchBookedSessions();
            // If admin, refresh the unfiltered admin sessions list as well
            if (currentUser?.is_staff) await fetchAllSessions();

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

    // Admin: remove an attendee from a session
    const removeAttendee = async (sessionId, attendeeId) => {
        if (!window.confirm("Remove this attendee from the session?")) return;
        try {
            await api.post(`/sessions/${sessionId}/remove_attendee/`, { user_id: attendeeId });
            // Refresh admin sessions and other lists
            await fetchAllSessions();
            await fetchSessions();
            await fetchBookedSessions();
            alert("Attendee removed.");
        } catch (err) {
            console.error("Error removing attendee:", err);
            alert(err.response?.data?.detail || "Failed to remove attendee.");
        }
    };

    // Logout user and clear tokens
    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("currentUser");
        navigate("/login");
    };

    // Clicking a calendar day → open modal showing sessions (non-admin).
    // For admins, filter the admin sessions list to that date instead.
    const handleDrillDown = (date) => {
        const dateStr = moment(date).format("YYYY-MM-DD");
        if (currentUser?.is_staff) {
            setSelectedAdminDate(dateStr);
            return false; // don't open modal for admins
        }

        const eventsForDate = sessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );
        if (eventsForDate.length > 0) {
            setModalDate(date);
            setModalEvents(eventsForDate);
            setShowModal(true);
        }
        return false; // Prevent default drilldown
    };

    // ------------------ UTILS ------------------

    // Map activity type to emoji icon
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

    // ------------------ CALENDAR CELL WRAPPER ------------------

    const DateCellWrapper = ({ children, value }) => {
        const dateStr = moment(value).format("YYYY-MM-DD");

        // Apply current activity filter to decide which emojis to show
        const displayedSessions = activityFilter
            ? sessions.filter((s) => s.activity_type === activityFilter)
            : sessions;

        const dayEvents = displayedSessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );

        const containerStyle = { position: "relative", width: "100%", height: "100%", boxSizing: "border-box" };
        if (dayEvents.length === 0) return <div style={containerStyle}>{children}</div>;

        // Determine unique activities to display only one emoji per type
        const uniqueActivities = [...new Set(dayEvents.map((e) => e.activity_type))];
        const emojis = uniqueActivities.map(getActivityEmoji).join(" ");

        const countText = `${dayEvents.length} ${dayEvents.length === 1 ? "session" : "sessions"}`;

        // Styles for the button and emoji bar
        const buttonStyleWithFlex = {
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
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderRadius: 8,
            padding: "4px 8px",
            border: "1px solid rgba(0,0,0,0.1)",
            background: "#0d6efd",
            color: "white",
        };

        const emojiBarStyle = {
            position: "absolute",
            bottom: 36,
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

        return (
            <div
                style={containerStyle}
                onClick={(e) => {
                    // Allow admins to click anywhere in the cell to select the date
                    if (currentUser?.is_staff) {
                        e.stopPropagation();
                        const dateStr = moment(value).format("YYYY-MM-DD");
                        setSelectedAdminDate(dateStr);
                    }
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>{children}</div>
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
                    <span>{countText}</span>
                </button>
            </div>
        );
    };

    // ------------------ JSX ------------------

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
                    localizer={localiser}
                    events={[]} // Hide default events
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    onDrillDown={handleDrillDown}
                    views={["month"]}
                    components={{ event: () => null, dateCellWrapper: DateCellWrapper }}
                />
            </div>

            {/* Legend / Info */}
            <p className="mt-3">
                <strong>Click a day to view sessions in the modal.</strong>
                <br />
                <small>
                    Activity icons: 🏃 Cardio | 🏋️ Weights | 🧘 Yoga | ⚡ HIIT | 🤸 Pilates
                </small>
            </p>

            {/* My Bookings / Admin View */}
            <div className="mb-4">
                <h5>{currentUser?.is_staff ? "All Sessions (Admin)" : "My Bookings"}</h5>

                {currentUser?.is_staff ? (
                    adminLoading ? (
                        <p style={{ color: "#666" }}>Loading attendees...</p>
                    ) : (
                        (() => {
                            const displayed = selectedAdminDate
                                ? adminSessions.filter((s) => moment(s.date).format("YYYY-MM-DD") === selectedAdminDate)
                                : adminSessions;
                            return (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 600 }}>
                                            Showing: {selectedAdminDate ? moment(selectedAdminDate).format('MMMM D, YYYY') : 'All Dates'}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => setSelectedAdminDate(null)}
                                                className="btn btn-sm btn-light me-2"
                                            >
                                                Show all
                                            </button>
                                            <button
                                                onClick={() => setSelectedAdminDate(moment().format('YYYY-MM-DD'))}
                                                className="btn btn-sm btn-outline-secondary"
                                            >
                                                Today
                                            </button>
                                        </div>
                                    </div>
                                    {displayed.length === 0 ? (
                                        <div style={{ color: '#666' }}>No sessions for this date.</div>
                                    ) : (
                                        <ul>
                                            {displayed.map((s) => (
                                                <li key={s.id} style={{ marginBottom: 12 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <strong>{s.activity_type.toUpperCase()}</strong> —{' '}
                                                            {moment(s.date).format("MMMM D, YYYY")} @ {s.time.slice(0, 5)}
                                                            {s.available_slots !== undefined && (
                                                                <span style={{ marginLeft: 8, color: "#666" }}>({s.available_slots} slots)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: 6, paddingLeft: 6 }}>
                                                        {s.attendees && s.attendees.length > 0 ? (
                                                            <div style={{ fontSize: 13, color: '#333' }}>
                                                                {s.attendees.map((a, i) => (
                                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 420 }}>
                                                                        <div>{typeof a === 'object' ? a.username : `User ${a}`}</div>
                                                                        <div>
                                                                            <button
                                                                                onClick={() => removeAttendee(s.id, typeof a === 'object' ? a.id : a)}
                                                                                style={{
                                                                                    marginLeft: 12,
                                                                                    padding: '4px 8px',
                                                                                    fontSize: 12,
                                                                                    borderRadius: 6,
                                                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                                                    background: '#dc3545',
                                                                                    color: 'white',
                                                                                    cursor: 'pointer',
                                                                                }}
                                                                                title="Remove attendee"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: 13, color: '#666' }}>No bookings</div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })()
                    )
                ) : (
                    bookedSessions.length === 0 ? (
                        <p style={{ color: "#666" }}>You have no bookings yet.</p>
                    ) : (
                        <ul>
                            {bookedSessions.map((s) => (
                                <li
                                    key={s.id}
                                    style={{
                                        marginBottom: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div>
                                        <strong>{s.activity_type.toUpperCase()}</strong> —{' '}
                                        {moment(s.date).format("MMMM D, YYYY")} @ {s.time.slice(0, 5)}
                                        {s.available_slots !== undefined && (
                                            <span style={{ marginLeft: 8, color: "#666" }}>
                                                ({s.available_slots} slots)
                                            </span>
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
                                                padding: "6px 10px",
                                                fontSize: 12,
                                                borderRadius: 6,
                                                border: "1px solid rgba(0,0,0,0.1)",
                                                background: "#dc3545",
                                                color: "white",
                                                cursor: "pointer",
                                            }}
                                            title="Cancel booking"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </div>

            {/* Modal */}
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
                            backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                        onClick={() => setShowModal(false)}
                    />

                    {/* Modal content */}
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
                        {/* Modal Header */}
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

                        {/* Modal Body */}
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
