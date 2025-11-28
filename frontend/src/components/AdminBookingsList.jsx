import React from "react";
import moment from "moment";

// AdminBookingsList: displays the unfiltered sessions for staff users. The
// component shows sessions for the currently-selected admin date (or all
// sessions) and renders attendee names with a Remove button. For past sessions,
// it also shows attendance status and allows toggling attended/no-show.
const AdminBookingsList = ({ currentUser, adminSessions, selectedAdminDate, setSelectedAdminDate, adminLoading, removeAttendee, markAttendance }) => {
    // Only render for staff users; the serializer masks attendee details for
    // non-staff so this component would not be useful otherwise.
    if (!currentUser?.is_staff) return null;

    const displayed = selectedAdminDate
        ? adminSessions.filter((s) => moment(s.date).format("YYYY-MM-DD") === selectedAdminDate)
        : adminSessions;

    return (
        <>
            {adminLoading ? (
                <p style={{ color: "#666" }}>Loading attendees...</p>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>
                            Showing: {selectedAdminDate ? moment(selectedAdminDate).format('MMMM D, YYYY') : 'All Dates'}
                        </div>
                        <div>
                            {/* Controls to show all dates or jump to today */}
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
                                                {s.attendees.map((a, i) => {
                                                    const isPast = moment(s.date).add(s.time.slice(0, 5), 'hours').isBefore(moment());
                                                    return (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 520 }}>
                                                            <div>
                                                                {typeof a === 'object' ? a.username : `User ${a}`}
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
                                        ) : (
                                            <div style={{ fontSize: 13, color: '#666' }}>No bookings</div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </>
    );
};

export default AdminBookingsList;
