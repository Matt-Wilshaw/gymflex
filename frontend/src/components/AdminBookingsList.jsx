import React, { useState, useEffect, useRef } from "react";
import moment from "moment";

// AdminBookingsList: displays the unfiltered sessions for staff users. The
// component shows sessions for the currently-selected admin date (or all
// sessions) and renders attendee names with a Remove button. For past sessions,
// it also shows attendance status and allows toggling attended/no-show.
const AdminBookingsList = ({ currentUser, adminSessions, selectedAdminDate, setSelectedAdminDate, adminLoading, removeAttendee, markAttendance, showBookingsPanel, setShowBookingsPanel }) => {
    // Track which sessions are expanded (by session id)
    const [expandedSessions, setExpandedSessions] = useState({});
    const panelRef = useRef(null);

    // Toggle a session's expanded state
    const toggleSession = (sessionId) => {
        setExpandedSessions(prev => ({
            ...prev,
            [sessionId]: !prev[sessionId]
        }));
    };
    // Only render for staff users; the serializer masks attendee details for
    // non-staff so this component would not be useful otherwise.
    if (!currentUser?.is_staff) return null;

    // Show loading state while fetching data
    if (adminLoading && adminSessions.length === 0) {
        return (
            <div style={{ marginTop: '1rem', color: '#666' }}>
                Loading sessions...
            </div>
        );
    }

    // Get all unique session dates (sorted)
    // Generate a full date range for admin scrolling
    let minDate = moment();
    let maxDate = moment();
    if (adminSessions.length > 0) {
        minDate = moment(Math.min(...adminSessions.map(s => moment(s.date).valueOf())));
        maxDate = moment(Math.max(...adminSessions.map(s => moment(s.date).valueOf())));
    }
    // Extend maxDate by 14 days for future planning
    maxDate = maxDate.clone().add(14, 'days');
    const allDates = [];
    let d = minDate.clone();
    while (d.isSameOrBefore(maxDate, 'day')) {
        allDates.push(d.format('YYYY-MM-DD'));
        d.add(1, 'day');
    }
    // If no date selected, default to today if available, else first available
    const currentDate = selectedAdminDate || (allDates.includes(moment().format('YYYY-MM-DD')) ? moment().format('YYYY-MM-DD') : allDates[0]);
    const displayed = adminSessions.filter((s) => moment(s.date).format('YYYY-MM-DD') === currentDate);

    // When panel opens, scroll into view AFTER the expand transition completes
    useEffect(() => {
        if (!showBookingsPanel || !panelRef.current) return;

        const el = panelRef.current;
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
    }, [showBookingsPanel]);

    return (
        <>
            <div>
                {/* Toggle bookings button */}
                <div style={{ marginBottom: 12 }}>
                    <button
                        className="today-btn"
                        onClick={() => setShowBookingsPanel(!showBookingsPanel)}
                        title={showBookingsPanel ? "Hide bookings panel" : "Open bookings panel"}
                    >
                        {showBookingsPanel ? "Hide Bookings" : "Open Bookings"}
                    </button>
                </div>
                <div
                    ref={panelRef}
                    style={{
                        maxHeight: showBookingsPanel ? '2000px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-in-out',
                        opacity: showBookingsPanel ? 1 : 0,
                    }}
                >
                    {/* In-panel date context and navigation */}
                    <div style={{
                        padding: '6px 8px',
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: 6,
                        marginBottom: 8
                    }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    const idx = allDates.indexOf(currentDate);
                                    if (idx > 0) setSelectedAdminDate(allDates[idx - 1]);
                                }}
                                disabled={allDates.indexOf(currentDate) === 0}
                                title="Previous day"
                            >
                                ←
                            </button>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSelectedAdminDate(moment().format('YYYY-MM-DD'))}
                                title="Today"
                                disabled={currentDate === moment().format('YYYY-MM-DD')}
                            >
                                Today
                            </button>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    const idx = allDates.indexOf(currentDate);
                                    if (idx < allDates.length - 1) setSelectedAdminDate(allDates[idx + 1]);
                                }}
                                disabled={allDates.indexOf(currentDate) === allDates.length - 1}
                                title="Next day"
                            >
                                →
                            </button>
                        </div>
                        <div style={{ fontWeight: 600, marginTop: '10px' }}>
                            Showing: {moment(currentDate).format('ddd DD/MM/YY')}
                        </div>
                    </div>
                    {adminLoading && adminSessions.length === 0 ? (
                        <div style={{ color: '#666' }}>Loading sessions...</div>
                    ) : displayed.length === 0 ? (
                        <div style={{ color: '#666' }}>No sessions for this date.</div>
                    ) : (
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {displayed.map((s) => {
                                const isExpanded = expandedSessions[s.id];
                                const bookedCount = s.attendees ? s.attendees.length : 0;

                                return (
                                    <li key={s.id} style={{
                                        marginBottom: 8,
                                        border: '1px solid #ddd',
                                        borderRadius: 6,
                                        padding: 10,
                                        background: '#f8f9fa'
                                    }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                userSelect: 'none'
                                            }}
                                            onClick={() => toggleSession(s.id)}
                                        >
                                            <div>
                                                <strong>{s.activity_type.toUpperCase()}</strong> @ {s.time.slice(0, 5)}
                                                <span style={{ marginLeft: 8, color: "#666" }}>
                                                    ({bookedCount}/{s.capacity} booked)
                                                </span>
                                            </div>
                                            <span style={{ color: '#666', fontSize: 18 }}>
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #ddd' }}>
                                                {s.attendees && s.attendees.length > 0 ? (
                                                    <div style={{ fontSize: 13, color: '#333' }}>
                                                        {s.attendees.map((a, i) => {
                                                            const isPast = moment(s.date).add(s.time.slice(0, 5), 'hours').isBefore(moment());
                                                            const isNoShow = isPast && typeof a === 'object' && a.attended === false;
                                                            return (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 6, background: 'white', borderRadius: 4 }}>
                                                                    <div>
                                                                        <span style={isNoShow ? { textDecoration: 'line-through', color: '#888' } : {}}>
                                                                            {typeof a === 'object' ? (a.username.charAt(0).toUpperCase() + a.username.slice(1)) : `User ${a}`}
                                                                        </span>
                                                                        {isPast && typeof a === 'object' && a.attended !== undefined && (
                                                                            <span style={{ marginLeft: 12, color: a.attended ? 'green' : 'red', fontWeight: 600 }}>
                                                                                {a.attended ? 'Attended' : 'No Show'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                        <button
                                                                            onClick={() => removeAttendee(s.id, typeof a === 'object' ? a.id : a)}
                                                                            style={{
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
                                                                        {isPast && typeof a === 'object' && a.attendance_id && (
                                                                            <button
                                                                                onClick={() => markAttendance(s.id, a.attendance_id, !a.attended)}
                                                                                style={{
                                                                                    padding: '4px 8px',
                                                                                    fontSize: 12,
                                                                                    borderRadius: 6,
                                                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                                                    background: a.attended ? '#ffc107' : '#198754',
                                                                                    color: 'white',
                                                                                    cursor: 'pointer',
                                                                                }}
                                                                                title={a.attended ? 'Mark as No Show' : 'Mark as Attended'}
                                                                            >
                                                                                {a.attended ? 'Mark No Show' : 'Mark Attended'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : adminLoading ? (
                                                    <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>Loading...</div>
                                                ) : (
                                                    <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>No bookings</div>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminBookingsList;
