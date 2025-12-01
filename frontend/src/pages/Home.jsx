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

    // Toggle visibility of bookings panel (admin only)
    const [showBookingsPanel, setShowBookingsPanel] = useState(false);

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
    // Sort upcoming bookings by date and time
    const sortedUpcomingBookings = [...upcomingBookings].sort((a, b) => {
        const aDate = moment(`${a.date}T${a.time}`);
        const bDate = moment(`${b.date}T${b.time}`);
        return aDate.diff(bDate);
    });
    const groupedBookings = groupBookings(sortedUpcomingBookings, bookingsGroupBy);

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2>GymFlex Calendar</h2>
                    {currentUser && <h4 className="mt-1">Welcome, {currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)}</h4>}
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
                bookedSessions={sortedUpcomingBookings} // Pass booked sessions for tick display
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
                <h5 className="mb-2">{currentUser?.is_staff ? "All Sessions (Admin)" : "My Bookings"}</h5>
                <div className="d-flex align-items-center gap-2 mb-2">
                    {!currentUser?.is_staff && groupedBookings.length > 1 && (
                            <>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                                    disabled={currentDayIndex === 0}
                                    title="Previous day"
                                >
                                    ←
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setCurrentDayIndex(0)}
                                    title="Today"
                                >
                                    Today
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setCurrentDayIndex(Math.min(groupedBookings.length - 1, currentDayIndex + 1))}
                                    disabled={currentDayIndex === groupedBookings.length - 1}
                                    title="Next day"
                                >
                                    →
                                </button>
                                <div className="text-center ms-2">
                                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#333" }}>
                                        {groupedBookings[currentDayIndex]?.label}
                                    </div>
                                </div>
                            </>
                        )}
                </div>
                {/* Disclaimer for clients about cancellation restriction */}
                {!currentUser?.is_staff && upcomingBookings.length > 0 && (
                    <div className="alert alert-info" style={{ fontSize: 14, marginBottom: 12 }}>
                        <strong>Note:</strong> You cannot cancel a booking within 30 minutes of the session start time. If you need to cancel late, please contact a trainer or admin.
                    </div>
                )}
                {currentUser?.is_staff ? (
                    <>
                        <div style={{ fontWeight: 600, marginBottom: 8, textAlign: 'left' }}>
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
                            showBookingsPanel={showBookingsPanel}
                            setShowBookingsPanel={setShowBookingsPanel}
                        />
                    </>
                ) : (
                    upcomingBookings.length === 0 ? (
                        <p style={{ color: "#666" }}>You have no upcoming bookings.</p>
                    ) : (
                        <div>
                            {/* Only show 'by day' view for clients */}
                            <div style={{ marginBottom: 24 }}>
                                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                    {groupedBookings[currentDayIndex]?.sessions.map((s) => (
                                        <li
                                            key={s.id}
                                            style={{
                                                marginBottom: 8,
                                                padding: "12px 16px",
                                                background: "#f8f9fa",
                                                borderRadius: 6,
                                                border: "1px solid #dee2e6",
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong>{s.activity_type.toUpperCase()}</strong> @ {s.time.slice(0, 5)}
                                                    {/* Removed: slots and attendee info for clients */}
                                                </div>
                                                <div>
                                                    {/* Cancel button is disabled within 30 minutes of session start */}
                                                    {(() => {
                                                        const sessionDateTime = moment(`${s.date}T${s.time}`);
                                                        const now = moment();
                                                        const canCancel = sessionDateTime.diff(now, 'minutes') > 30;
                                                        return (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (canCancel) handleBook(s);
                                                                }}
                                                                style={{
                                                                    marginLeft: 12,
                                                                    padding: "6px 10px",
                                                                    fontSize: 12,
                                                                    borderRadius: 6,
                                                                    border: "1px solid rgba(0,0,0,0.1)",
                                                                    background: canCancel ? "#dc3545" : "#adb5bd",
                                                                    color: "white",
                                                                    cursor: canCancel ? "pointer" : "not-allowed",
                                                                }}
                                                                title={canCancel ? "Cancel booking" : "Cannot cancel within 30 minutes of session start"}
                                                                disabled={!canCancel}
                                                            >
                                                                Cancel
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
