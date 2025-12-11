import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { createPortal } from "react-dom";

// Setup calendar localiser using Moment.js
const localiser = momentLocalizer(moment);

const CalendarView = ({ sessions, activityFilter, setActivityFilter, handleDrillDown, currentUser, selectedAdminDate, setSelectedAdminDate, selectedClientDate, setSelectedClientDate, showBookingsPanel, setShowBookingsPanel, bookedSessions, onVisibleMonthChange }) => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 576 : false;

    const [calendarDate, setCalendarDate] = useState(() => {
        if (currentUser?.is_staff) {
            return selectedAdminDate ? moment(selectedAdminDate).toDate() : new Date();
        }
        return selectedClientDate ? moment(selectedClientDate).toDate() : new Date();
    });

    useEffect(() => {
        if (currentUser?.is_staff && selectedAdminDate) {
            setCalendarDate(moment(selectedAdminDate).toDate());
        }
    }, [selectedAdminDate, currentUser]);

    useEffect(() => {
        if (!currentUser?.is_staff && selectedClientDate) {
            setCalendarDate(moment(selectedClientDate).toDate());
        }
    }, [selectedClientDate, currentUser]);

    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToToday = () => {
            const today = new Date();
            try {
                setCalendarDate(today);
                if (!currentUser?.is_staff) {
                    setSelectedClientDate(moment(today).format('YYYY-MM-DD'));
                    setShowBookingsPanel(false);
                } else {
                    setSelectedAdminDate(moment(today).format('YYYY-MM-DD'));
                }
            } catch (_) { }
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
                    <button className="arrow-btn" onClick={goToBack}>←</button>
                    <button className="today-btn" onClick={goToToday}>Today</button>
                    <button className="arrow-btn" onClick={goToNext}>→</button>
                </div>
                <span className="calendar-month-label" style={{ fontSize: '18px', fontWeight: '600' }}>
                    {toolbar.label}
                </span>
                <div style={{ width: '200px' }}></div>
            </div>
        );
    };

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

    const ToolbarTip = () => (
        <div style={{ color: '#555', marginBottom: '6px', marginTop: '4px' }}>
            <small>Click a day to view sessions.</small>
        </div>
    );

    const DateCellWrapper = ({ children, value }) => {
        const dateStr = moment(value).format("YYYY-MM-DD");
        const isPastDate = moment(value).isBefore(moment(), 'day');
        const isOtherMonth = moment(value).month() !== moment(selectedAdminDate || selectedClientDate || new Date()).month();

        const isSelected = (currentUser?.is_staff && selectedAdminDate && moment(selectedAdminDate).format("YYYY-MM-DD") === dateStr) ||
            (!currentUser?.is_staff && selectedClientDate && moment(selectedClientDate).format("YYYY-MM-DD") === dateStr);
        const isToday = moment(value).isSame(moment(), 'day');

        const displayedSessions = activityFilter
            ? sessions.filter((s) => s.activity_type === activityFilter)
            : sessions;
        const dayEvents = displayedSessions.filter(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr
        );

        const hasBooking = bookedSessions && bookedSessions.some(
            (s) => moment(s.date).format("YYYY-MM-DD") === dateStr &&
                (!activityFilter || s.activity_type === activityFilter)
        );

        const hasAnyBooking = currentUser?.is_staff && dayEvents.some(
            (s) => s.attendees && s.attendees.length > 0
        );

        const containerStyle = {
            position: "relative",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            backgroundColor: isSelected ? "#d4e9ff" : isOtherMonth ? "#f0f0f0" : isPastDate ? "#f5f5f5" : "transparent",
            opacity: isPastDate ? 0.5 : isOtherMonth ? 0.7 : 1,
            cursor: (isPastDate && !currentUser?.is_staff) ? "not-allowed" : "pointer",
            border: isSelected ? "2px solid #0d6efd" : "none",
            transition: "all 0.2s ease",
            zIndex: 5
        };

        const containerRef = useRef(null);
        const [overlayPos, setOverlayPos] = useState(null);

        const updateOverlay = () => {
            const el = containerRef.current;
            if (!el) return setOverlayPos(null);
            const rect = el.getBoundingClientRect();
            setOverlayPos({ top: rect.top, left: rect.left, right: rect.right, width: rect.width, height: rect.height });
        };

        useLayoutEffect(() => {
            // Ensure overlay position is calculated when the cell is selected or when it's today.
            if (!(isSelected || isToday)) {
                setOverlayPos(null);
                return;
            }
            updateOverlay();
            window.addEventListener('resize', updateOverlay);
            window.addEventListener('scroll', updateOverlay, true);
            return () => {
                window.removeEventListener('resize', updateOverlay);
                window.removeEventListener('scroll', updateOverlay, true);
            };
        }, [isSelected, isToday, value]);

        // Ensure the native date link (rendered in `children`) visually pops above other elements
        // by cloning it and applying inline styles. This is stronger than component CSS rules
        // and avoids DOM reordering that can interfere with click handling.
        const childrenWithEnhancedDate = React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.props && typeof child.props.className === 'string' && child.props.className.includes('rbc-button-link')) {
                const existingStyle = child.props.style || {};
                const enhancedStyle = {
                    ...existingStyle,
                    position: 'relative',
                    zIndex: 9999,
                    background: 'rgba(255,255,255,0.98)',
                    borderRadius: 6,
                    padding: '2px 6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    color: '#0b1a2b',
                    fontWeight: 600,
                    pointerEvents: 'none',
                };
                return React.cloneElement(child, { style: enhancedStyle });
            }
            return child;
        });

        if (dayEvents.length === 0) {
            return (
                <div
                    ref={containerRef}
                    className={`${isSelected ? 'selected-calendar-cell' : ''} ${isToday ? 'today-calendar-cell' : ''}`.trim()}
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
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", pointerEvents: "none" }}>{childrenWithEnhancedDate}</div>
                    {(isSelected || isToday) && overlayPos && createPortal(
                        <span className="calendar-portal-date" style={{ position: 'fixed', top: overlayPos.top + 4 + 'px', left: (overlayPos.left + overlayPos.width - 22) + 'px', pointerEvents: 'none' }}>
                            {moment(value).date()}
                        </span>,
                        document.body
                    )}
                </div>
            );
        }

        const uniqueActivities = [...new Set(dayEvents.map((e) => e.activity_type))];
        const map = {
            cardio: "🏃",
            weights: "🏋️",
            yoga: "🧘",
            hiit: "⚡",
            pilates: "🤸",
        };
        const emojiElements = Array.from({ length: 5 }).map((_, i) => {
            const activityType = uniqueActivities[i];
            return (
                <span
                    key={i}
                    style={{
                        display: "inline-block",
                        width: "22px",
                        minWidth: "22px",
                        textAlign: "center",
                        opacity: activityType ? 1 : 0,
                    }}
                >
                    {activityType ? map[activityType] || "💪" : "💪"}
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
            zIndex: 30,
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
            zIndex: 30,
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
            zIndex: 30,
        };

        return (
            <div
                ref={containerRef}
                className={`${isSelected ? 'selected-calendar-cell' : ''} ${isToday ? 'today-calendar-cell' : ''}`.trim()}
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
                <div style={{ display: "flex", flexDirection: "column", height: "100%", pointerEvents: "none", position: "relative", zIndex: 1 }}>
                    {childrenWithEnhancedDate}
                </div>
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
                            zIndex: 30,
                        }}
                        title={hasBooking ? "You have a booking on this day" : "Has bookings"}
                    >
                        ✓
                    </span>
                )}
                {(isSelected || isToday) && overlayPos && createPortal(
                    <span className="calendar-portal-date" style={{ position: 'fixed', top: overlayPos.top + 4 + 'px', left: (overlayPos.left + overlayPos.width - 22) + 'px', pointerEvents: 'none' }}>
                        {moment(value).date()}
                    </span>,
                    document.body
                )}
            </div>
        );
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <style>{`
                /* Ensure date numbers are visible and above background */
                .rbc-date-cell {
                    position: relative;
                    z-index: 2;
                }
                .rbc-date-cell .rbc-button-link {
                    margin-top: 2px;
                    position: relative;
                    z-index: 60;
                    pointer-events: none;
                }
                /* When using the portal overlay, hide the in-cell native date number to avoid duplication */
                .selected-calendar-cell .rbc-button-link,
                .today-calendar-cell .rbc-button-link {
                    opacity: 0;
                }
                
                @media (min-width: 768px) {
                    .rbc-month-view {
                        min-height: 450px !important;
                    }
                    .rbc-month-row {
                        min-height: 70px !important;
                    }
                }
                
                @media (max-width: 767px) {
                    .rbc-month-view {
                        min-height: 380px !important;
                    }
                    .rbc-month-row {
                        min-height: 56px !important;
                    }
                    .custom-calendar-toolbar {
                        padding: 6px 0 !important;
                        margin-bottom: 6px !important;
                    }
                    .calendar-month-label {
                        font-size: 16px !important;
                    }
                    .arrow-btn, .today-btn {
                        font-size: 12px !important;
                        padding: 3px 8px !important;
                    }
                }
                
                @media (max-width: 576px) {
                    .rbc-month-view {
                        min-height: 350px !important;
                    }
                    .rbc-month-row {
                        min-height: 50px !important;
                    }
                    .rbc-header {
                        font-size: 11px !important;
                        padding: 4px 2px !important;
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
                /* Portal overlay for selected day number (compact) */
                .calendar-portal-date {
                    position: fixed !important;
                    z-index: 2147483647 !important;
                    pointer-events: none !important;
                    background: rgba(255,255,255,0.96) !important;
                    padding: 1px 4px !important;
                    border-radius: 4px !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.08) !important;
                    font-weight: 700 !important;
                    color: #0b1a2b !important;
                    font-size: 11px !important;
                    line-height: 1 !important;
                }
            `}</style>
            <Calendar
                localizer={localiser}
                events={[]}
                startAccessor="start"
                endAccessor="end"
                style={{ height: isMobile ? 'auto' : '600px', width: '100%', maxWidth: '100%' }}
                onDrillDown={handleDrillDown}
                views={["month"]}
                date={calendarDate}
                onNavigate={(newDate) => {
                    setCalendarDate(moment(newDate).toDate());
                    try {
                        if (typeof onVisibleMonthChange === 'function') {
                            onVisibleMonthChange(moment(newDate).startOf('month').format('YYYY-MM'));
                        }
                    } catch (_) { }
                    if (currentUser?.is_staff) {
                        const dateStr = moment(newDate).format('YYYY-MM-DD');
                        setSelectedAdminDate(dateStr);
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
};

export default CalendarView;