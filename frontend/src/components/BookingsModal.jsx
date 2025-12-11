import React from "react";
import moment from "moment";

// BookingsModal: presents a modal dialogue listing the sessions for the
// selected day. Clicking a session item calls `handleBook` which toggles
// the booking for the current user. The overlay closes the modal when
// clicked; the modal itself stops propagation so inner clicks do not
// close it accidentally.
const BookingsModal = ({ showModal, modalEvents, modalDate, setShowModal, handleBook }) => {
    if (!showModal) return null;

    return (
        <>
            {/* Background overlay - clicking here dismisses the modal */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(30,34,45,0.35)",
                    zIndex: 1040,
                }}
                onClick={() => setShowModal(false)}
            />

            {/* Modal window - stopPropagation prevents overlay from catching clicks */}
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

                {/* List sessions - clicking an item toggles booking */}
                <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                    {modalEvents.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#666" }}>No sessions available on this day.</p>
                    ) : (
                        modalEvents.map((event) => (
                            <div
                                key={event.id}
                                style={{
                                    backgroundColor: event.has_started
                                        ? "#e9ecef"
                                        : event.booked
                                            ? "#fff5f5"
                                            : "#f0fdf4",
                                    border: event.has_started
                                        ? "2px solid #adb5bd"
                                        : event.booked
                                            ? "2px solid #dc3545"
                                            : "2px solid #198754",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    marginBottom: "12px",
                                    cursor: event.has_started ? "not-allowed" : "pointer",
                                    opacity: event.has_started ? 0.6 : 1,
                                }}
                                onClick={() => !event.has_started && handleBook(event)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "600", fontSize: "16px" }}>
                                            {event.activity_type.toUpperCase()}
                                        </div>
                                        <div style={{ color: "#666" }}>
                                            🕐 {moment(event.time, 'HH:mm:ss').format('HH:mm')} - {moment(event.time, 'HH:mm:ss').add(event.duration_minutes, 'minutes').format('HH:mm')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div
                                            style={{
                                                backgroundColor: event.has_started ? "#adb5bd" : "#6c757d",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            {event.has_started ? "Past" : `${event.available_slots} slots`}
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
    );
};

export default BookingsModal;
