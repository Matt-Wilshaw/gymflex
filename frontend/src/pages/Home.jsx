// src/pages/Home.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { momentLocalizer } from "react-big-calendar";
import moment from "moment";
import api from "../api";
import CalendarView from "../components/CalendarView";
import BookingsModal from "../components/BookingsModal";
import AdminBookingsList from "../components/AdminBookingsList";
import useSessions from "../hooks/useSessions";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

// Home: main dashboard page. It composes the calendar/timetable, modal and
// bookings lists. Data fetching and mutation logic are provided by the
// `useSessions` hook so this file focuses on composition and UI state.
const Home = () => {
    const {
        sessions,
        bookedSessions,
        adminSessions,
        adminLoading,
        currentUser,
        selectedAdminDate,
        setSelectedAdminDate,
        setCurrentUser,
        fetchSessions,
        fetchBookedSessions,
        fetchAllSessions,
        fetchCurrentUser,
        handleBook: hookHandleBook,
        removeAttendee: hookRemoveAttendee,
        markAttendance,
        handleLogout: hookHandleLogout,
    } = useSessions();
    const navigate = useNavigate();
    // Currently selected activity filter from dropdown
    const [activityFilter, setActivityFilter] = useState("");

    // Modal visibility and content
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);

    // Bookings view grouping: "day" or "week"
    const [bookingsGroupBy, setBookingsGroupBy] = useState("day");

    // Day pagination state (for "by day" view only)
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    // Current logged-in user information is provided by the `useSessions` hook

    // (bookedSessions, adminSessions, adminLoading, currentUser, selectedAdminDate are provided by the hook)

    // JWT token stored in localStorage
    const token = localStorage.getItem(ACCESS_TOKEN) || "";

    // ------------------ EFFECTS ------------------

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        (async () => {
            const user = await fetchCurrentUser();
            await fetchSessions(activityFilter);
            await fetchBookedSessions();
            if (user?.is_staff) await fetchAllSessions();
        })();
    }, [token, navigate]);

    // Re-fetch sessions when activity filter changes
    useEffect(() => {
        if (!token) return;
        fetchSessions(activityFilter);
    }, [activityFilter, token]);

    // ------------------ API CALLS ------------------

    // Fetch sessions from backend; apply client-side activity filter
    // (fetchSessions, fetchBookedSessions, fetchAllSessions, fetchCurrentUser provided by hook)

    // ------------------ HANDLERS ------------------

    // Handle booking/unbooking a session
    // wrap hook handleBook so we can update modalEvents here
    const handleBook = async (session) => {
        try {
            const { status, refreshed } = await hookHandleBook(session);
            alert(`Booking status: ${status}`);

            if (showModal && modalDate && refreshed) {
                const dateStr = moment(modalDate).format("YYYY-MM-DD");
                const eventsForDate = refreshed.filter(
                    (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
                );
                setModalEvents(eventsForDate);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.status || err.response?.data?.error || "Booking failed. Please try again.";
            alert(errorMsg);
        }
    };

    // Admin: remove an attendee from a session
    const removeAttendee = async (sessionId, attendeeId) => {
        if (!window.confirm("Remove this attendee from the session?")) return;
        try {
            await hookRemoveAttendee(sessionId, attendeeId);
            alert("Attendee removed.");
        } catch (err) {
            console.error("Error removing attendee:", err);
            alert(err.response?.data?.detail || "Failed to remove attendee.");
        }
    };

    // Logout user and clear tokens
    const handleLogout = () => hookHandleLogout(navigate);

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

    // Map activity type to emoji icon (kept for potential use elsewhere)
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

    // Group bookings by day or week
    const groupBookings = (bookings, groupBy) => {
        if (groupBy === "day") {
            // Group by exact date
            const grouped = {};
            bookings.forEach((session) => {
                const dateKey = moment(session.date).format("YYYY-MM-DD");
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(session);
            });
            return Object.entries(grouped).map(([date, sessions]) => ({
                label: moment(date).format("dddd, MMMM D, YYYY"),
                sessions,
            }));
        } else {
            // Group by week (starting Monday)
            const grouped = {};
            bookings.forEach((session) => {
                const weekStart = moment(session.date).startOf("isoWeek").format("YYYY-MM-DD");
                if (!grouped[weekStart]) grouped[weekStart] = [];
                grouped[weekStart].push(session);
            });
            return Object.entries(grouped).map(([weekStart, sessions]) => {
                const weekEnd = moment(weekStart).endOf("isoWeek");
                return {
                    label: `Week of ${moment(weekStart).format("MMM D")} - ${weekEnd.format("MMM D, YYYY")}`,
                    sessions: sessions.sort((a, b) => moment(a.date).diff(moment(b.date))),
                };
            });
        }
    };

    // ------------------ JSX ------------------

    // Only show upcoming bookings (hide past ones)
    const upcomingBookings = bookedSessions.filter((s) => !s.has_started);
    const groupedBookings = groupBookings(upcomingBookings, bookingsGroupBy);

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
                            onClick={() => window.open(import.meta.env.VITE_API_URL.replace('/api', '/admin/'), "_blank")}
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
            <CalendarView
                sessions={sessions}
                activityFilter={activityFilter}
                handleDrillDown={handleDrillDown}
                currentUser={currentUser}
                selectedAdminDate={selectedAdminDate}
                setSelectedAdminDate={setSelectedAdminDate}
            />

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
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5>{currentUser?.is_staff ? "All Sessions (Admin)" : "My Bookings"}</h5>
                    {!currentUser?.is_staff && upcomingBookings.length > 0 && (
                        <div className="d-flex align-items-center gap-2">
                            <div className="btn-group btn-group-sm" role="group">
                                <button
                                    type="button"
                                    className={`btn ${bookingsGroupBy === "day" ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => {
                                        setBookingsGroupBy("day");
                                        setCurrentDayIndex(0);
                                    }}
                                >
                                    By Day
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${bookingsGroupBy === "week" ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => setBookingsGroupBy("week")}
                                >
                                    By Week
                                </button>
                            </div>

                            {/* Day navigation (only visible in "by day" mode) */}
                            {bookingsGroupBy === "day" && groupedBookings.length > 1 && (
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                                        disabled={currentDayIndex === 0}
                                        title="Previous day"
                                    >
                                        ←
                                    </button>
                                    <div className="text-center">
                                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#333" }}>
                                            {groupedBookings[currentDayIndex]?.label}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666" }}>
                                            Day {currentDayIndex + 1} of {groupedBookings.length}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setCurrentDayIndex(Math.min(groupedBookings.length - 1, currentDayIndex + 1))}
                                        disabled={currentDayIndex === groupedBookings.length - 1}
                                        title="Next day"
                                    >
                                        →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {currentUser?.is_staff ? (
                    <>
                        <div style={{ fontWeight: 600, marginBottom: 4, textAlign: 'left' }}>
                            Showing: {selectedAdminDate ? moment(selectedAdminDate).format('MMMM D, YYYY') : moment().format('MMMM D, YYYY')}
                        </div>
                        <AdminBookingsList
                            currentUser={currentUser}
                            adminSessions={adminSessions}
                            selectedAdminDate={selectedAdminDate}
                            setSelectedAdminDate={setSelectedAdminDate}
                            adminLoading={adminLoading}
                            removeAttendee={removeAttendee}
                            markAttendance={markAttendance}
                        />
                    </>
                ) : (
                    upcomingBookings.length === 0 ? (
                        <p style={{ color: "#666" }}>You have no upcoming bookings.</p>
                    ) : (
                        <div>
                            {bookingsGroupBy === "day" ? (
                                // Show single day when in "by day" mode
                                groupedBookings[currentDayIndex] && (
                                    <div style={{ marginBottom: 24 }}>
                                        <h6 style={{ color: "#333", marginBottom: 8 }}>
                                            {groupedBookings[currentDayIndex].label}
                                        </h6>
                                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                            {groupedBookings[currentDayIndex].sessions.map((s) => (
                                                <li
                                                    key={s.id}
                                                    style={{
                                                        marginBottom: 8,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "8px 12px",
                                                        background: "#f8f9fa",
                                                        borderRadius: 6,
                                                        border: "1px solid #dee2e6",
                                                    }}
                                                >
                                                    <div>
                                                        <strong>{s.activity_type.toUpperCase()}</strong>
                                                        <span style={{ marginLeft: 8 }}>@ {s.time.slice(0, 5)}</span>
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
                                    </div>
                                )
                            ) : (
                                // Show all groups when in "by week" mode
                                groupedBookings.map((group, idx) => (
                                    <div key={idx} style={{ marginBottom: 24 }}>
                                        <h6 style={{ color: "#333", marginBottom: 8 }}>{group.label}</h6>
                                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                            {group.sessions.map((s) => (
                                                <li
                                                    key={s.id}
                                                    style={{
                                                        marginBottom: 8,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "8px 12px",
                                                        background: "#f8f9fa",
                                                        borderRadius: 6,
                                                        border: "1px solid #dee2e6",
                                                    }}
                                                >
                                                    <div>
                                                        <strong>{s.activity_type.toUpperCase()}</strong>
                                                        {bookingsGroupBy === "week" && (
                                                            <span style={{ marginLeft: 8, color: "#666" }}>
                                                                {moment(s.date).format("ddd MMM D")}
                                                            </span>
                                                        )}
                                                        <span style={{ marginLeft: 8 }}>@ {s.time.slice(0, 5)}</span>
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
                                    </div>
                                ))
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Modal */}
            <BookingsModal
                showModal={showModal}
                modalEvents={modalEvents}
                modalDate={modalDate}
                setShowModal={setShowModal}
                handleBook={handleBook}
            />
        </div>
    );
};

export default Home;
