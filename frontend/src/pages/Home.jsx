// src/pages/Home.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
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
        bookingsLoading,
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

    // Track initial loading state
    const [initialLoading, setInitialLoading] = useState(true);

    // Modal visibility and content
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);

    // Bookings view grouping: "day" or "week"
    const [bookingsGroupBy, setBookingsGroupBy] = useState("day");

    // Day pagination state (for "by day" view only)
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    // Toggle visibility of bookings panel (admin and client)
    const [showBookingsPanel, setShowBookingsPanel] = useState(false);

    // Track selected date for client calendar view - initialize with today's date like admin does
    const [selectedClientDate, setSelectedClientDate] = useState(moment().format("YYYY-MM-DD"));

    // Ref for client bookings panel scroll behavior
    const clientPanelRef = useRef(null);

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
            setInitialLoading(false);
        })();
    }, [token, navigate]);

    // Re-fetch sessions when activity filter changes
    useEffect(() => {
        if (!token) return;
        fetchSessions(activityFilter);
    }, [activityFilter, token]);

    // Control page overflow based on loading state and bookings panel visibility
    useEffect(() => {
        if (initialLoading) {
            // Hide scroll during loading
            document.body.style.overflow = 'hidden';
        } else if (!currentUser?.is_staff && !showBookingsPanel) {
            // Hide scroll when bookings panel is closed for clients
            document.body.style.overflow = 'hidden';
        } else if (currentUser?.is_staff && !showBookingsPanel) {
            // Hide scroll when bookings panel is closed for admins
            document.body.style.overflow = 'hidden';
        } else {
            // Show scroll when bookings panel is open
            document.body.style.overflow = 'auto';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [initialLoading, showBookingsPanel, currentUser]);

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

    // Only show upcoming bookings (hide past ones), sorted by date/time
    const sortedUpcomingBookings = useMemo(() => {
        const upcoming = bookedSessions.filter((s) => !s.has_started);
        return upcoming.sort((a, b) => {
            const aDate = moment(`${a.date}T${a.time}`);
            const bDate = moment(`${b.date}T${b.time}`);
            return aDate.diff(bDate);
        });
    }, [bookedSessions]);

    const groupedBookings = useMemo(() => {
        return groupBookings(sortedUpcomingBookings, bookingsGroupBy);
    }, [sortedUpcomingBookings, bookingsGroupBy]);

    // Update selected client date when navigating bookings
    useEffect(() => {
        if (!currentUser?.is_staff && groupedBookings.length > 0) {
            if (groupedBookings[currentDayIndex]) {
                const firstSession = groupedBookings[currentDayIndex].sessions[0];
                if (firstSession) {
                    console.log('Setting selectedClientDate to:', firstSession.date);
                    setSelectedClientDate(firstSession.date);
                }
            }
        }
    }, [currentDayIndex, groupedBookings, currentUser]);

    // When client bookings panel opens, scroll into view AFTER the expand transition completes
    useEffect(() => {
        if (!showBookingsPanel || !clientPanelRef.current || currentUser?.is_staff) return;

        const el = clientPanelRef.current;
        const scrollNow = () => {
            try {
                el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
            } catch (_) {
                // Fallback for older browsers
                const top = el.getBoundingClientRect().top + window.scrollY - 8;
                window.scrollTo(0, top);
            }
        };

        const onTransitionEnd = (e) => {
            if (e && e.propertyName && e.propertyName !== 'max-height') return;
            scrollNow();
            el.removeEventListener('transitionend', onTransitionEnd);
        };

        // Listen for the max-height transition to finish, then scroll
        el.addEventListener('transitionend', onTransitionEnd);
        // Fallback timer slightly longer than CSS transition (300ms)
        const t = setTimeout(scrollNow, 350);

        return () => {
            el.removeEventListener('transitionend', onTransitionEnd);
            clearTimeout(t);
        };
    }, [showBookingsPanel, currentUser]);

    // Get current month label for mobile header
    const currentMonthLabel = useMemo(() => {
        if (groupedBookings.length === 0) return "";
        const firstSessionDate = groupedBookings[0].sessions[0].date;
        return moment(firstSessionDate).format("MMMM YYYY");
    }, [groupedBookings]);

    return (
        <div className="container mt-4" style={{ background: "linear-gradient(120deg, #e0f7ff 0%, #ffffff 100%)", minHeight: "100dvh", paddingLeft: "22px", paddingRight: "22px", paddingTop: "18px" }}>
            {/* Show loading screen until initial data is loaded */}
            {initialLoading ? (
                <div className="loading-screen">
                    <img src="/favicons/favicon.svg" alt="GymFlex logo" className="loading-logo" />
                    <div className="loading-text">GymFlex</div>
                </div>
            ) : (
                <React.Fragment>
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '1.5rem',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src="/favicons/favicon.svg" alt="GymFlex logo" style={{ height: '45px', width: '45px', objectFit: 'cover', margin: 0, padding: 0, borderRadius: '50%', background: '#3498db' }} />
                            <h2 style={{ margin: 0, padding: 0, color: '#2c3e50' }}>GymFlex</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {currentUser && (
                                <button
                                    className="logout-icon-btn"
                                    onClick={handleLogout}
                                    aria-label="Logout"
                                    style={{
                                        padding: '0.4rem',
                                        borderRadius: '50%',
                                        background: '#3498db',
                                        border: 'none',
                                        boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#2980b9'}
                                    onMouseOut={e => e.currentTarget.style.background = '#3498db'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Welcome message and username under logo/title */}
                    {currentUser && window.innerWidth >= 768 && (
                        <div style={{ textAlign: 'left', marginBottom: '1.2rem', marginLeft: '2px' }}>
                            <h4 className="mt-1" style={{ margin: 0, fontWeight: 500, color: '#2c3e50' }}>
                                Welcome, {currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)}
                            </h4>
                        </div>
                    )}

                    {/* Mobile header: month selector + welcome message */}
                    {window.innerWidth < 768 ? (
                        <div className="calendar-header-mobile" style={{ gap: 0, marginBottom: 4 }}>
                            {currentUser && (
                                <span className="welcome-message-mobile">
                                    Welcome, {currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)}
                                </span>
                            )}
                        </div>
                    ) : null}
                    {/* Always render calendar and legend below header */}
                    <div className="calendar-container">
                        <CalendarView
                            sessions={sessions}
                            activityFilter={activityFilter}
                            setActivityFilter={setActivityFilter}
                            handleDrillDown={handleDrillDown}
                            currentUser={currentUser}
                            selectedAdminDate={selectedAdminDate}
                            setSelectedAdminDate={setSelectedAdminDate}
                            selectedClientDate={selectedClientDate}
                            setSelectedClientDate={setSelectedClientDate}
                            bookedSessions={sortedUpcomingBookings}
                        />

                        <div className="legend-container">
                            <div className="legend-info">
                                <small className="activity-legend" style={{ display: 'block', marginBottom: '4px' }}>
                                    <strong>Activities:</strong> 🏃 Cardio | 🏋️ Weights | 🧘 Yoga | ⚡ HIIT | 🤸 Pilates
                                </small>
                                <small className="info-legend" style={{ display: 'block' }}>
                                    <strong>Info:</strong> <span style={{ display: 'inline-block', padding: '2px 6px', background: '#3498db', color: 'white', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>3</span> Session count
                                    {' '}|{' '}
                                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> Booked slot/s
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* My Bookings / Admin View */}
                    <div className="mb-4" style={{ marginTop: '8px' }}>
                        {currentUser?.is_staff ? (
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
                        ) : (
                            <React.Fragment>
                                {/* Client Bookings Toggle Button */}
                                <button
                                    className="btn btn-primary mb-2 w-100 show-bookings-btn"
                                    style={{ borderRadius: '8px' }}
                                    onClick={() => setShowBookingsPanel(!showBookingsPanel)}
                                // ...existing code...
                                >
                                    {showBookingsPanel ? "Hide" : "Show"} My Bookings
                                </button>

                                {/* Collapsible Client Bookings Panel */}
                                <div
                                    ref={clientPanelRef}
                                    style={{
                                        maxHeight: showBookingsPanel ? "1000px" : "0",
                                        overflow: "hidden",
                                        transition: "max-height 0.3s ease-in-out",
                                    }}
                                >
                                    {bookingsLoading ? (
                                        <p style={{ color: "#666", padding: "12px" }}>Loading your bookings...</p>
                                    ) : sortedUpcomingBookings.length === 0 ? (
                                        <p style={{ color: "#666", padding: "12px" }}>You have no upcoming bookings.</p>
                                    ) : (
                                        <div className="bookings-panel-inner" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', padding: '16px' }}>
                                            {/* Navigation Controls */}
                                            {groupedBookings.length > 1 && (
                                                <div className="d-flex align-items-center gap-2 mb-3" style={{ marginBottom: '8px', flexWrap: 'wrap' }}>
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
                                                        title="Go to next upcoming session"
                                                    >
                                                        Next Session
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => setCurrentDayIndex(Math.min(groupedBookings.length - 1, currentDayIndex + 1))}
                                                        disabled={currentDayIndex === groupedBookings.length - 1}
                                                        title="Next day"
                                                    >
                                                        →
                                                    </button>
                                                    <div className="text-center ms-2" style={{ minWidth: '180px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#333", marginTop: '6px', display: 'flex', alignItems: 'center' }}>
                                                            <span>
                                                                Showing: {moment(groupedBookings[currentDayIndex]?.date).format('ddd DD/MM/YY')}
                                                            </span>
                                                            <span style={{ marginLeft: '8px', cursor: 'pointer', position: 'relative' }}
                                                                onClick={e => {
                                                                    const tip = e.currentTarget.querySelector('.client-note-tooltip');
                                                                    if (tip) tip.style.display = tip.style.display === 'block' ? 'none' : 'block';
                                                                }}
                                                                onBlur={e => {
                                                                    const tip = e.currentTarget.querySelector('.client-note-tooltip');
                                                                    if (tip) tip.style.display = 'none';
                                                                }}
                                                                tabIndex={0}
                                                            >
                                                                <svg width="16" height="16" fill="#3498db" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                                                    <circle cx="8" cy="8" r="8" fill="#e9ecef"/>
                                                                    <text x="8" y="12" textAnchor="middle" fontSize="10" fill="#3498db">i</text>
                                                                </svg>
                                                                <span className="client-note-tooltip" style={{ display: 'none', position: 'absolute', left: '24px', top: '-8px', background: '#fff', color: '#333', border: '1px solid #e9ecef', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', zIndex: 10, minWidth: '180px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                                                    <strong>Note:</strong> You cannot cancel a booking within 30 minutes of the session start time. If you need to contact a trainer or admin.
                                                                </span>
                                                            </span>
                                                        </div>
                                                        </div>
                                                        <div className="alert alert-info" style={{ fontSize: 15, margin: '4px 0 0 0', padding: '8px 12px', borderRadius: '8px' }}>
                                                            <strong>Note:</strong> You cannot cancel a booking within 30 minutes of the session start time. If you need to contact a trainer or admin.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Disclaimer for clients about cancellation restriction */}

                                            {/* Bookings List */}
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
                                                                    <strong>{s.activity_type.toUpperCase()}</strong>
                                                                    <span style={{ marginLeft: 8, color: '#666' }}>
                                                                        {moment(s.time, 'HH:mm:ss').format('HH:mm')} - {moment(s.time, 'HH:mm:ss').add(s.duration_minutes, 'minutes').format('HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div>
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
                                    )}
                                </div>
                            </React.Fragment>
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
                </React.Fragment>
            )}
        </div>
    );
}

export default Home;