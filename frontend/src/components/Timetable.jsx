import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import api from "../api"; // your axios instance
import { ACCESS_TOKEN } from "../constants";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup localizer for react-big-calendar using moment.js
const localizer = momentLocalizer(moment);

export default function Timetable() {
    // State to store calendar events
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect runs once when component mounts
    useEffect(() => {
        // Async function to fetch sessions from backend
        const fetchSessions = async () => {
            try {
                // Get JWT token from localStorage
                const token = localStorage.getItem(ACCESS_TOKEN);

                // Fetch sessions with authentication header
                const res = await api.get("/sessions/", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Log the fetched data to check in console
                console.log("Fetched sessions:", res.data);

                // Map each session to an event for the calendar
                const mappedEvents = res.data.map((session) => ({
                    title: `${session.title} — ${session.trainer_username}`,
                    start: new Date(`${session.date}T${session.time}`),
                    end: new Date(
                        new Date(`${session.date}T${session.time}`).getTime() + 60 * 60 * 1000
                    ), // default 1-hour duration
                }));

                // Save mapped events to state
                setEvents(mappedEvents);
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                // Stop loading spinner
                setLoading(false);
            }
        };

        fetchSessions(); // Call the async function
    }, []); // Empty dependency array ensures it runs only once

    // Show loading while fetching
    if (loading) return <p>Loading timetable...</p>;

    return (
        <div style={{ margin: "20px" }}>
            <h2>Gym Sessions Calendar</h2>
            <Calendar
                localizer={localizer}
                events={events}        // Array of events
                startAccessor="start"  // Field for event start date
                endAccessor="end"      // Field for event end date
                style={{ height: 600 }}
            />

            {/* Simple list of sessions for debugging/visual check */}
            <h3>Session List</h3>
            <ul>
                {events.map((event, index) => (
                    <li key={index}>
                        {event.title} — {event.start.toLocaleString()} to {event.end.toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
}
