import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

// CalendarView: renders a month calendar with a custom date cell wrapper.
// The cell wrapper shows a compact emoji summary and a small session-count
// button. For staff users the whole cell is clickable to select a date for
// admin viewing; for regular users the button opens a modal drill-down.
const CalendarView = ({ sessions, activityFilter, handleDrillDown, currentUser, setSelectedAdminDate }) => {
    // DateCellWrapper: computes the events for the given day and renders
    // a small emoji bar plus a session-count button anchored to the cell.
    // Note the UK spelling of 'behaviour' in comments below to match
    // project convention.
    const DateCellWrapper = ({ children, value }) => {
        const dateStr = moment(value).format("YYYY-MM-DD");

        // Apply current activity filter to decide which emojis to show
        const displayedSessions = activityFilter
            ? sessions.filter((s) => s.activity_type === activityFilter)
            : sessions;

        const dayEvents = displayedSessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );

        // containerStyle ensures the emoji bar and button are positioned
        // relative to the calendar cell. If there are no events for the
        // day we just render the default cell contents.
        const containerStyle = { position: "relative", width: "100%", height: "100%", boxSizing: "border-box" };
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
        return (
            <div
                style={containerStyle}
                onClick={(e) => {
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

    return (
        <div style={{ height: 600 }}>
            <Calendar
                localizer={localiser}
                events={[]}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onDrillDown={handleDrillDown}
                views={["month"]}
                components={{ event: () => null, dateCellWrapper: DateCellWrapper }}
            />
        </div>
    );
};

export default CalendarView;
