// src/pages/Home.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { momentLocalizer } from "react-big-calendar";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
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
    // Track if panel was auto-collapsed (should persist across renders)
    const autoCollapsedRef = useRef(false);
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

    // Track booking note visibility
    const [showBookingNote, setShowBookingNote] = useState(false);

    // Modal visibility and content
    const [showModal, setShowModal] = useState(false);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState(null);

    // Bookings view grouping: "day" or "week"
    const [bookingsGroupBy, setBookingsGroupBy] = useState("day");

    // Day pagination state (for "by day" view only)
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    // Toggle visibility of bookings panel (admin and client)
    const [showBookingsPanel, setShowBookingsPanel] = useState(false); // always collapsed on initial load

    // Track selected date for client calendar view - initialize with today's date like admin does
    // Always default to today's date on initial load
    const [selectedClientDate, setSelectedClientDate] = useState(() => moment().format("YYYY-MM-DD"));
    // Track if user manually closed the bookings panel
    const [userClosedPanel, setUserClosedPanel] = useState(true); // true on initial load to prevent auto-open

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
        // For clients: close bookings panel when activity filter changes
        if (!currentUser?.is_staff && showBookingsPanel) {
            setShowBookingsPanel(false);
        }
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
            toast.success(`Booking status: ${status}`);

            if (showModal && modalDate && refreshed) {
                const dateStr = moment(modalDate).format("YYYY-MM-DD");
                const eventsForDate = refreshed.filter(
                    (s) => moment(s.date).format("YYYY-MM-DD") === dateStr &&
                        (!activityFilter || s.activity_type === activityFilter)
                );
                setModalEvents(eventsForDate);
            }
            // Refresh booked sessions so UI (button state / lists) updates
            // when a booking is created or cancelled. This will update
            // `bookedSessions` in the sessions hook and recompute
            // `sortedUpcomingBookings`/`visibleMonthHasBookings` via effects.
            try {
                await fetchBookedSessions();
            } catch (__) {
                // Fetch errors are ignored; UI will show the latest known state
            }
        } catch (err) {
            const errorMsg = err.response?.data?.status || err.response?.data?.error || "Booking failed. Please try again.";
            toast.error(errorMsg);
        }
    };

    // Remove an attendee from a session (admin only)
    const removeAttendee = async (sessionId, attendeeId) => {
        if (!window.confirm("Remove this attendee from the session?")) return;
        try {
            await hookRemoveAttendee(sessionId, attendeeId);
            toast.success("Attendee removed.");
        } catch (err) {
            console.error("Error removing attendee:", err);
            toast.error(err.response?.data?.detail || "Failed to remove attendee.");
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
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr &&
                (!activityFilter || s.activity_type === activityFilter)
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
        const upcoming = bookedSessions.filter((s) => !s.has_started && (!activityFilter || s.activity_type === activityFilter));
        return upcoming.sort((a, b) => {
            const aDate = moment(`${a.date}T${a.time}`);
            const bDate = moment(`${b.date}T${b.time}`);
            return aDate.diff(bDate);
        });
    }, [bookedSessions, activityFilter]);

    const groupedBookings = useMemo(() => {
        return groupBookings(sortedUpcomingBookings, bookingsGroupBy);
    }, [sortedUpcomingBookings, bookingsGroupBy]);

    // Update selected client date when navigating bookings — only when
    // the bookings panel is open. This prevents the app from overriding
    // the default (today) on initial load when there are sessions.
    useEffect(() => {
        if (!currentUser?.is_staff && showBookingsPanel && groupedBookings.length > 0) {
            const group = groupedBookings[currentDayIndex];
            if (group && group.sessions && group.sessions[0]) {
                setSelectedClientDate(group.sessions[0].date);
            }
        }
    }, [currentDayIndex, groupedBookings, currentUser, showBookingsPanel]);

    // When client bookings panel opens, scroll to top so calendar and buttons are at top
    useEffect(() => {
        if (!showBookingsPanel || currentUser?.is_staff) return;

        const scrollToTop = () => {
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (_) {
                window.scrollTo(0, 0);
            }
        };

        // Scroll immediately
        scrollToTop();
    }, [showBookingsPanel, currentUser]);

    // Get current month label for mobile header
    const currentMonthLabel = useMemo(() => {
        if (groupedBookings.length === 0) return "";
        const firstSessionDate = groupedBookings[0].sessions[0].date;
        return moment(firstSessionDate).format("MMMM YYYY");
    }, [groupedBookings]);

    // Visible month (YYYY-MM) tracked from CalendarView
    const [visibleMonth, setVisibleMonth] = useState(moment(selectedClientDate).format('YYYY-MM'));
    const [visibleMonthHasBookings, setVisibleMonthHasBookings] = useState(false);

    // Update visibleMonthHasBookings when sortedUpcomingBookings or visibleMonth changes
    const isInitialMount = useRef(true);
    useEffect(() => {
        // For admins, check adminSessions; for clients, check bookedSessions
        const dataToCheck = currentUser?.is_staff ? adminSessions : sortedUpcomingBookings;
        const has = dataToCheck.some(s => moment(s.date).format('YYYY-MM') === visibleMonth);
        setVisibleMonthHasBookings(has);

        // Only apply auto-collapse logic for non-admin users
        if (!currentUser?.is_staff) {
            // If user navigates to a month with no bookings, collapse the panel but do not change selectedClientDate
            if (showBookingsPanel && !has) {
                setShowBookingsPanel(false);
                autoCollapsedRef.current = true;
            }

            // If panel was auto-collapsed and user navigates to a month with bookings, reopen panel and jump to first session
            if (!isInitialMount.current && has && autoCollapsedRef.current) {
                setShowBookingsPanel(true);
                autoCollapsedRef.current = false;
                const bookingsInMonth = sortedUpcomingBookings.filter(s => moment(s.date).format('YYYY-MM') === visibleMonth);
                if (bookingsInMonth.length > 0) {
                    const firstDate = bookingsInMonth[0].date;
                    setSelectedClientDate(firstDate);
                    const idx = groupedBookings.findIndex(g => g.sessions.some(ss => ss.date === firstDate));
                    if (idx >= 0) setCurrentDayIndex(idx);
                }
            } else if (!isInitialMount.current && has && showBookingsPanel && visibleMonth !== moment().format('YYYY-MM')) {
                // Always jump to first session when navigating months with menu open (except current month)
                const bookingsInMonth = sortedUpcomingBookings.filter(s => moment(s.date).format('YYYY-MM') === visibleMonth);
                if (bookingsInMonth.length > 0) {
                    const firstDate = bookingsInMonth[0].date;
                    setSelectedClientDate(firstDate);
                    const idx = groupedBookings.findIndex(g => g.sessions.some(ss => ss.date === firstDate));
                    if (idx >= 0) setCurrentDayIndex(idx);
                }
            }
        }
        // On initial mount, always highlight today's date and keep menu collapsed
        if (isInitialMount.current) {
            setSelectedClientDate(moment().format("YYYY-MM-DD"));
            setShowBookingsPanel(false);
        }
        // When navigating to current month with panel closed, highlight today's date
        if (visibleMonth === moment().format('YYYY-MM') && !showBookingsPanel && !isInitialMount.current) {
            setSelectedClientDate(moment().format("YYYY-MM-DD"));
        }
        isInitialMount.current = false;
    }, [visibleMonth, sortedUpcomingBookings, adminSessions, showBookingsPanel, groupedBookings, userClosedPanel, currentUser]);

    // When activity filter changes and bookings panel is open, reset to first matching booking
    useEffect(() => {
        if (showBookingsPanel && !currentUser?.is_staff) {
            setCurrentDayIndex(0);
        }
    }, [activityFilter]);

    return (
        <div className="container mt-4" style={{
            background: "#e0f7ff",
            minHeight: "100dvh",
            paddingLeft: window.innerWidth < 768 ? "12px" : "22px",
            paddingRight: window.innerWidth < 768 ? "12px" : "22px",
            paddingTop: window.innerWidth < 768 ? "6px" : "9px"
        }}>
            <style>{`.today-btn[aria-disabled="true"]{ cursor: not-allowed !important; }`}</style>
            {/* Show loading screen until initial data is loaded */}
            {initialLoading ? (
                <div className="loading-screen" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e3e6f3 100%)',
                    zIndex: 9999
                }}>
                    <div className="loading-text" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '2rem', fontWeight: 700, color: '#3498db', letterSpacing: '2px'
                    }}>
                        GymFlex
                        <div style={{ marginTop: '2rem' }}>
                            <div className="spinner" style={{
                                width: '40px', height: '40px', border: '4px solid #3498db', borderTop: '4px solid #e3e6f3', borderRadius: '50%', animation: 'spin 1s linear infinite'
                            }}></div>
                        </div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
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
                            justifyContent: 'space-between',
                            marginTop: '9px', // Move header down a bit
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                                src={import.meta.env.MODE === 'development' ? '/gymflex-logo.png' : '/static/gymflex-logo.png'}
                                alt="GymFlex logo"
                                style={{ height: '45px', width: '45px', objectFit: 'cover', margin: 0, padding: 0, borderRadius: '50%', background: '#3498db' }}
                                onError={e => { e.target.onerror = null; e.target.src = import.meta.env.MODE === 'development' ? '/gymflex-logo.png' : '/static/gymflex-logo.png'; }}
                            />
                            <h2 style={{ margin: 0, padding: 0, color: '#2c3e50' }}>GymFlex</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 768 ? '8px' : '12px' }}>
                            {currentUser?.is_staff && (
                                <a
                                    href={(() => {
                                        // Use the API base URL, strip trailing /api if present, then add /admin/
                                        let apiUrl = import.meta.env.VITE_API_URL || '';
                                        if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
                                        if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
                                        return apiUrl + '/admin/';
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-panel-btn"
                                    style={{
                                        padding: window.innerWidth < 768 ? '0.3rem' : '0.4rem',
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
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        width={window.innerWidth < 768 ? "18" : "22"}
                                        height={window.innerWidth < 768 ? "18" : "22"}
                                        viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" fill="#3498db" stroke="#3498db" strokeWidth="2" />
                                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#fff" strokeWidth="1.5" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#fff" strokeWidth="1.5" />
                                    </svg>
                                </a>
                            )}
                            {currentUser && (
                                <button
                                    className="logout-icon-btn"
                                    onClick={handleLogout}
                                    aria-label="Logout"
                                    style={{
                                        padding: window.innerWidth < 768 ? '0.3rem' : '0.4rem',
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
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        width={window.innerWidth < 768 ? "18" : "22"}
                                        height={window.innerWidth < 768 ? "18" : "22"}
                                        viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Welcome message and username under logo/title */}
                    {currentUser && (
                        <div style={{ textAlign: 'left', marginBottom: '1.2rem', marginLeft: '2px' }}>
                            <span style={{ margin: 0, fontWeight: 500, color: '#2c3e50', fontSize: '20px' }}>
                                Welcome, {typeof currentUser.username === 'string' && currentUser.username
                                  ? currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)
                                  : ''}
                            </span>
                        </div>
                    )}
                    {/* Always render calendar and legend below header */}
                    <div className="calendar-container" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#e0f7ff' }}>
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
                            showBookingsPanel={showBookingsPanel}
                            setShowBookingsPanel={setShowBookingsPanel}
                            bookedSessions={sortedUpcomingBookings}
                            onVisibleMonthChange={setVisibleMonth}
                        />

                        <div className="legend-container">
                            <div className="legend-info">
                                <small className="activity-legend" style={{ display: 'block', marginBottom: '4px' }}>
                                    <strong>Activities:</strong> 🏃 Cardio | 🏋️ Weights | 🧘 Yoga | ⚡ HIIT | 🤸 Pilates
                                </small>
                                <small className="info-legend" style={{ display: 'block' }}>
                                    <strong>Info:</strong> <span style={{ display: 'inline-block', padding: '2px 6px', background: '#3498db', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>3</span> Session count
                                    {' '}|{' '}
                                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> Booked slot/s
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* My Bookings / Admin View */}
                    <div className="mb-4" style={{ marginTop: window.innerWidth < 768 ? '6px' : '8px' }}>
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
                                    className="today-btn"
                                    onClick={(e) => {
                                        const today = moment().format('YYYY-MM-DD');
                                        const todayMonth = moment().format('YYYY-MM');
                                        if (showBookingsPanel) {
                                            // closing
                                            setShowBookingsPanel(false);
                                            setUserClosedPanel(true);
                                            if (visibleMonth === todayMonth) {
                                                setSelectedClientDate(today);
                                            } else {
                                                setSelectedClientDate(null);
                                            }
                                        } else {
                                            // opening
                                            setShowBookingsPanel(true);
                                            setUserClosedPanel(false);
                                            // find sessions in visibleMonth
                                            const sessionsInMonth = sortedUpcomingBookings.filter(s => moment(s.date).format('YYYY-MM') === visibleMonth);
                                            if (sessionsInMonth.length > 0) {
                                                setSelectedClientDate(sessionsInMonth[0].date);
                                                const idx = groupedBookings.findIndex(g => g.sessions.some(ss => ss.date === sessionsInMonth[0].date));
                                                if (idx >= 0) setCurrentDayIndex(idx);
                                            }
                                        }
                                    }}
                                    title={!visibleMonthHasBookings ? "No bookings in this month" : (showBookingsPanel ? "Hide bookings panel" : "Open Bookings panel")}
                                    aria-disabled={!visibleMonthHasBookings}
                                    style={{ minWidth: '120px', whiteSpace: 'nowrap', textAlign: 'center', padding: '4px 6px', fontSize: '12px', marginRight: '8px', ...(!visibleMonthHasBookings ? { opacity: 0.65, cursor: 'not-allowed' } : { cursor: 'pointer' }) }}
                                >
                                    {!visibleMonthHasBookings ? (
                                        "No Bookings"
                                    ) : (
                                        (showBookingsPanel ? "Hide Bookings" : "Open Bookings")
                                    )}
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
                                                <div style={{
                                                    background: '#f8f9fa',
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '6px',
                                                    padding: '6px 8px',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                                                            disabled={currentDayIndex === 0}
                                                            title="Previous day"
                                                            style={{ padding: '4px 6px', fontSize: '12px', minWidth: '34px' }}
                                                        >
                                                            ←
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => setCurrentDayIndex(0)}
                                                            title="Go to next upcoming session"
                                                            disabled={currentDayIndex === 0}
                                                            style={{ padding: '4px 6px', fontSize: '12px' }}
                                                        >
                                                            Next Session
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => setCurrentDayIndex(Math.min(groupedBookings.length - 1, currentDayIndex + 1))}
                                                            disabled={currentDayIndex === groupedBookings.length - 1}
                                                            title="Next day"
                                                            style={{ padding: '4px 6px', fontSize: '12px', minWidth: '34px' }}
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <button
                                                            onClick={() => setShowBookingNote(!showBookingNote)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                fontSize: '14px',
                                                                cursor: 'pointer',
                                                                padding: '4px 8px',
                                                                color: '#0066cc',
                                                            }}
                                                            title="Toggle note"
                                                        >
                                                            ℹ️ Note
                                                        </button>
                                                    </div>
                                                    {showBookingNote && (
                                                        <div className="alert alert-info" style={{ fontSize: '14px', margin: '8px 0 0 0', padding: '8px 12px', borderRadius: '8px' }}>
                                                            <strong>Note:</strong> You cannot cancel a booking within 30 minutes of the session start time. If you need to contact a trainer or admin.
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Disclaimer for clients about cancellation restriction */}

                                            {/* Date Display - Above Bookings List */}
                                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '12px', marginTop: '8px' }}>
                                                📅 {moment(selectedClientDate).format('ddd DD/MM/YY')}
                                            </div>

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
                                                                                    padding: "4px 8px",
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
            <Toaster position="top-center" />
        </div>
    );
}

export default Home;