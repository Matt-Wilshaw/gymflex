import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

// CalendarView: renders a month calendar with a custom date cell wrapper.
// The cell wrapper shows a compact emoji summary and a small session-count
// button. For staff users the whole cell is clickable to select a date for
// admin viewing; for regular users the button opens a modal drill-down.
const CalendarView = ({ sessions, activityFilter, setActivityFilter, handleDrillDown, currentUser, selectedAdminDate, setSelectedAdminDate, selectedClientDate, setSelectedClientDate, bookedSessions }) => {
    // Detect mobile screen
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 576 : false;

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        className="arrow-btn"
                        onClick={goToBack}
                    >
                        ←
                    </button>
                    <button
                        className="today-btn"
                        onClick={goToToday}
                    >
                        Today
                    </button>
                    <button
                        className="arrow-btn"
                        onClick={goToNext}
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

    // Activity Filter positioned below the toolbar
    const ActivityFilterSection = () => (
        <div style={{ marginBottom: '12px', marginTop: '-4px' }}>
            <label style={{ marginRight: '8px', fontWeight: 500, fontSize: '14px' }}>Filter by Activity:</label>
            <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="form-select d-inline-block"
                style={{ width: 'auto', minWidth: '150px', fontSize: '14px' }}
            >
                <option value="">All</option>
                <option value="cardio">Cardio</option>
                <option value="weights">Weightlifting</option>
                <option value="yoga">Yoga</option>
                <option value="hiit">HIIT</option>
                <option value="pilates">Pilates</option>
            </select>
        </div>
    );

    // Tip positioned directly below the filter
    const ToolbarTip = () => (
        <div style={{ color: '#555', marginBottom: '6px', marginTop: '4px' }}>
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
            cursor: (isPastDate && !currentUser?.is_staff) ? "not-allowed" : "pointer",
            border: isSelected ? "2px solid #0d6efd" : "none",
            transition: "all 0.2s ease"
        };
        if (dayEvents.length === 0) {
            return (
                <div
                    style={containerStyle}
                    onClick={(e) => {
                        if (isPastDate && !currentUser?.is_staff) {
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
            border: "2px solid #3498db",
            background: "#3498db",
            color: "white",
            boxShadow: "0 2px 4px rgba(52,152,219,0.10)",
            marginRight: "8px",
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
                    if (isPastDate && !currentUser?.is_staff) {
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
        <div>
            <style>{`
                /* Add 2px top margin to day numbers in month view */
                .rbc-month-view .rbc-date-cell .rbc-button-link {
                    margin-top: 2px;
                }
                @media (min-width: 768px) {
                    .rbc-month-view {
                        min-height: 520px !important;
                    }
                    .rbc-month-row {
                        min-height: 88px !important;
                    }
                }
                @media (max-width: 576px) {
                    .rbc-month-row {
                        height: 30px !important;
                    }
                    .emoji-bar-filtered {
                        bottom: 50px !important;
                    }
                }
                /* Vertical lines between date cells */
                .rbc-month-view .rbc-day-bg {
                    border-right: 1.5px solid #d0d0d0 !important;
                }
                .rbc-month-view .rbc-day-bg:nth-child(7n) {
                    border-right: none !important;
                }
                
                /* Horizontal lines between week rows */
                .rbc-month-view .rbc-month-row {
                    border-bottom: 1.5px solid #d0d0d0 !important;
                }
                
                /* Force flex layout */
                .rbc-row-bg {
                    display: flex !important;
                }
                
                .rbc-day-bg {
                    flex: 1 !important;
                }
            `}</style>
            <Calendar
                localizer={localiser}
                events={[]}
                startAccessor="start"
                endAccessor="end"
                style={isMobile ? { height: 'auto' } : { height: '700px' }}
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
                            {ActivityFilterSection()}
                            {ToolbarTip()}
                        </div>
                    )
                }}
            />
        </div>
    );
}; export default CalendarView;