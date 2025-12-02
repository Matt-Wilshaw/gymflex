import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

// CalendarView: renders a month calendar with a custom date cell wrapper.
// The cell wrapper shows a compact emoji summary and a small session-count
// button. For staff users the whole cell is clickable to select a date for
// admin viewing; for regular users the button opens a modal drill-down.
const CalendarView = ({ sessions, activityFilter, handleDrillDown, currentUser, selectedAdminDate, setSelectedAdminDate, selectedClientDate, bookedSessions }) => {
    // DateCellWrapper: computes the events for the given day and renders
    // a small emoji bar plus a session-count button anchored to the cell.
    // Note the UK spelling of 'behaviour' in comments below to match
    // project convention.
    const DateCellWrapper = ({ children, value }) => {
        const dateStr = moment(value).format("YYYY-MM-DD");
        const isPastDate = moment(value).isBefore(moment(), 'day');
        const isOtherMonth = moment(value).month() !== moment(selectedAdminDate || selectedClientDate || new Date()).month();

        // Debug logging
        const isToday = moment().format("YYYY-MM-DD") === dateStr;
        if (isToday && !currentUser?.is_staff) {
            console.log('selectedAdminDate:', selectedAdminDate, 'currentUser.is_staff:', currentUser?.is_staff);
        }

        const isSelected = (currentUser?.is_staff && selectedAdminDate && moment(selectedAdminDate).format("YYYY-MM-DD") === dateStr) ||
            (!currentUser?.is_staff && selectedClientDate && moment(selectedClientDate).format("YYYY-MM-DD") === dateStr);

        // Apply current activity filter to decide which emojis to show
        const displayedSessions = activityFilter
            ? sessions.filter((s) => s.activity_type === activityFilter)
            : sessions;
        const dayEvents = displayedSessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );
        // For tick: check if user has a booking on this day
        const hasBooking = bookedSessions && bookedSessions.some(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );

        // For admin: check if any session on this day has bookings
        const hasAnyBooking = currentUser?.is_staff && dayEvents.some(
            (s) => s.attendees && s.attendees.length > 0
        );

        // containerStyle ensures the emoji bar and button are positioned
        // relative to the calendar cell. If there are no events for the
        // day we just render the default cell contents.
        // Grey out past dates and lighten other months
        const containerStyle = {
            position: "relative",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            backgroundColor: isSelected ? "#d4e9ff" : isOtherMonth ? "#f0f0f0" : isPastDate ? "#f5f5f5" : "transparent",
            opacity: isPastDate ? 0.5 : isOtherMonth ? 0.7 : 1,
            cursor: isPastDate ? "not-allowed" : currentUser?.is_staff ? "pointer" : "default",
            border: isSelected ? "2px solid #0d6efd" : "none",
            transition: "all 0.2s ease"
        };
        if (dayEvents.length === 0) return <div style={containerStyle}>{children}</div>;

        const uniqueActivities = [...new Set(dayEvents.map((e) => e.activity_type))];
        const emojis = uniqueActivities
            .map((activityType) => {
                const map = {
                    cardio: "🏃",
                    weights: "🏋️",
                    yoga: "🧘",
                    hiit: "⚡",
                    pilates: "🤸",
                };
                return map[activityType] || "💪";
            })
            .join(" ");

        const countText = `${dayEvents.length} ${dayEvents.length === 1 ? "session" : "sessions"}`;

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

        // For staff users a click anywhere in the cell selects the date
        // for the admin bookings list; for non-staff users the small button
        // will call `handleDrillDown` to open the sessions modal. We stop
        // propagation on the button so the two actions do not conflict.
        // Prevent clicks on past dates.
        return (
            <div
                style={containerStyle}
                onClick={(e) => {
                    if (isPastDate) {
                        e.stopPropagation();
                        return;
                    }
                    if (currentUser?.is_staff) {
                        e.stopPropagation();
                        const dateStr = moment(value).format("YYYY-MM-DD");
                        setSelectedAdminDate(dateStr);
                    }
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>{children}</div>
                <div style={emojiBarStyle} title={uniqueActivities.join(", ")}>{emojis}</div>
                {/* Star for client bookings or admin days with bookings */}
                {(hasBooking || hasAnyBooking) && (
                    <span
                        style={{
                            position: "absolute",
                            bottom: 32,
                            right: 8,
                            fontSize: 20,
                            color: "#ffd700",
                            textShadow: "0 0 6px #fff200, 0 0 2px #ffd700",
                            pointerEvents: "none",
                        }}
                        title={hasBooking ? "You have a booking on this day" : "Has bookings"}
                    >
                        ★
                    </span>
                )}
                <button
                    onClick={(e) => {
                        if (isPastDate) {
                            e.stopPropagation();
                            return;
                        }
                        e.stopPropagation();
                        handleDrillDown(value);
                    }}
                    style={buttonStyleWithFlex}
                    title={uniqueActivities.join(", ")}
                    disabled={isPastDate}
                >
                    <span>{countText}</span>
                </button>
            </div>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                {/* Navigation buttons (if any) can go here */}
                {/* Example: <button>Prev</button> <button>Next</button> */}
            </div>
            <div style={{ height: 600 }}>
                <Calendar
                    localizer={localiser}
                    events={[]}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    onDrillDown={handleDrillDown}
                    views={["month"]}
                    date={currentUser?.is_staff
                        ? moment(selectedAdminDate).toDate()
                        : selectedClientDate
                            ? moment(selectedClientDate).toDate()
                            : new Date()}
                    onNavigate={(newDate) => {
                        console.log('Calendar navigated to:', moment(newDate).format('YYYY-MM-DD'));
                    }}
                    components={{ event: () => null, dateCellWrapper: DateCellWrapper }}
                />
            </div>
        </div>
    );
};

export default CalendarView;
