import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

// CalendarView: renders a month calendar with a custom date cell wrapper.
// The cell wrapper shows a compact emoji summary and a small session-count
// button. For staff users the whole cell is clickable to select a date for
// admin viewing; for regular users the button opens a modal drill-down.
const CalendarView = ({ sessions, activityFilter, handleDrillDown, currentUser, selectedAdminDate, setSelectedAdminDate, selectedClientDate, setSelectedClientDate, bookedSessions }) => {

    // Custom toolbar with Today button between arrows
    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToToday = () => {
            toolbar.onNavigate('TODAY');
        };

        return (
            <div className="custom-calendar-toolbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                padding: '10px 0',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={goToBack}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: 'white',
                            fontSize: '16px'
                        }}
                    >
                        ←
                    </button>
                    <button
                        onClick={goToToday}
                        style={{
                            padding: '8px 20px',
                            cursor: 'pointer',
                            border: '1px solid #0d6efd',
                            borderRadius: '4px',
                            background: '#0d6efd',
                            color: 'white',
                            fontWeight: '500',
                            fontSize: '14px'
                        }}
                    >
                        Today
                    </button>
                    <button
                        onClick={goToNext}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: 'white',
                            fontSize: '16px'
                        }}
                    >
                        →
                    </button>
                </div>
                <span className="calendar-month-label" style={{ fontSize: '18px', fontWeight: '600' }}>
                    {toolbar.label}
                </span>
                <div style={{ width: '200px' }}></div>
            </div>
        );
    };

    // Tip positioned directly below the toolbar (month selector)
    const ToolbarTip = () => (
        <div style={{ color: '#555', marginBottom: '6px', marginTop: '-4px' }}>
            <small>Click a day to view sessions.</small>
        </div>
        );

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
        // When filtering, only show tick if booking matches the filtered activity
        const hasBooking = bookedSessions && bookedSessions.some(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr &&
                (!activityFilter || s.activity_type === activityFilter)
        );

        // For admin: check if any session on this day has bookings
        // When filtering, only check sessions that match the filtered activity
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
            cursor: isPastDate ? "not-allowed" : "pointer",
            border: isSelected ? "2px solid #0d6efd" : "none",
            transition: "all 0.2s ease"
        };
        if (dayEvents.length === 0) {
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
                        } else {
                            e.stopPropagation();
                            handleDrillDown(value);
                        }
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", pointerEvents: "none" }}>{children}</div>
                </div>
            );
        }

        const uniqueActivities = [...new Set(dayEvents.map((e) => e.activity_type))];
        const emojiElements = uniqueActivities.map((activityType, index) => {
            const map = {
                cardio: "🏃",
                weights: "🏋️",
                yoga: "🧘",
                hiit: "⚡",
                pilates: "🤸",
            };
            return (
                <span key={index} style={{ display: "inline-block" }}>
                    {map[activityType] || "💪"}
                </span>
            );
        });

        const countText = `${dayEvents.length}`;

        const buttonStyleWithFlex = {
            position: "absolute",
            bottom: 6,
            left: 8,
            fontSize: 10,
            fontWeight: "600",
            pointerEvents: "none",
            width: "22px",
            height: "22px",
            minWidth: "22px",
            minHeight: "22px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            padding: "0",
            border: "2px solid #0d6efd",
            background: "#0d6efd",
            color: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        };

        const emojiBarStyle = activityFilter ? {
            position: "absolute",
            bottom: 56,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 16,
            pointerEvents: "none",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "transparent",
        } : {
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 13,
            pointerEvents: "none",
            width: "90%",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(2, auto)",
            gridAutoFlow: "row",
            gap: "2px",
            justifyItems: "center",
            alignItems: "center",
            textAlign: "center",
            background: "transparent",
            maxHeight: "34px",
            overflow: "hidden",
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
                    } else {
                        // For non-staff users, make the entire cell clickable
                        e.stopPropagation();
                        handleDrillDown(value);
                    }
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", height: "100%", pointerEvents: "none" }}>{children}</div>
                <div className={activityFilter ? "emoji-bar emoji-bar-filtered" : "emoji-bar"} style={emojiBarStyle} title={uniqueActivities.join(", ")}>
                    {emojiElements}
                </div>
                <div
                    className="session-count-circle"
                    style={buttonStyleWithFlex}
                    title={uniqueActivities.join(", ")}
                >
                    <span>{countText}</span>
                </div>
                {/* Checkmark to the right of the session count circle */}
                {(hasAnyBooking || hasBooking) && (
                    <span
                        className="booking-checkmark"
                        style={{
                            position: "absolute",
                            bottom: 6,
                            right: 8,
                            fontSize: 16,
                            color: "#28a745",
                            fontWeight: "bold",
                            pointerEvents: "none",
                        }}
                        title={hasBooking ? "You have a booking on this day" : "Has bookings"}
                    >
                        ✓
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ minHeight: 800, maxHeight: 1000, display: 'flex', flexDirection: 'column', marginBottom: 0, paddingBottom: 0, gap: 0, height: '100%' }}>
            <Calendar
                localizer={localiser}
                events={[]}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "700px", marginBottom: 0, paddingBottom: 0, display: 'block' }}
                onDrillDown={handleDrillDown}
                views={["month"]}
                date={currentUser?.is_staff
                    ? moment(selectedAdminDate).toDate()
                    : selectedClientDate
                        ? moment(selectedClientDate).toDate()
                        : new Date()}
                onNavigate={(newDate) => {
                    const dateStr = moment(newDate).format('YYYY-MM-DD');
                    if (currentUser?.is_staff) {
                        setSelectedAdminDate(dateStr);
                    } else {
                        setSelectedClientDate(dateStr);
                    }
                }}
                components={{
                    event: () => null,
                    dateCellWrapper: DateCellWrapper,
                    toolbar: (t) => (
                        <div>
                            {CustomToolbar(t)}
                            {ToolbarTip()}
                        </div>
                    )
                }}
            />
        </div>
    );
}; export default CalendarView;
