import { useState } from "react";
import moment from "moment";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

// useSessions: centralises session fetching and mutation logic. This hook
// returns the session lists and helper functions used by the Home page.
// Use UK spelling in comments: we say 'behaviour' and 'initialise'.
export default function useSessions() {
    const [sessions, setSessions] = useState([]);
    const [bookedSessions, setBookedSessions] = useState([]);
    const [adminSessions, setAdminSessions] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem("currentUser");
        return saved ? JSON.parse(saved) : null;
    });
    const [selectedAdminDate, setSelectedAdminDate] = useState(moment().format("YYYY-MM-DD"));

    // fetchSessions: gets sessions from the API and applies a client-side
    // activity filter if requested. We return the fetched list so callers
    // can further process it (for example to update modal contents).
    const fetchSessions = async (activityFilter) => {
        try {
            const res = await api.get(`/sessions/`);
            let filtered = res.data;
            if (activityFilter) filtered = filtered.filter((s) => s.activity_type === activityFilter);
            setSessions(filtered);
            return filtered;
        } catch (err) {
            console.error("Error fetching sessions:", err);
            if (err.response?.status === 401) return [];
            return [];
        }
    };

    // fetchBookedSessions: returns sessions where the API indicates the
    // current user has already booked (field `booked` === true).
    const fetchBookedSessions = async () => {
        setBookingsLoading(true);
        try {
            const res = await api.get(`/sessions/`);
            const userBooked = res.data.filter((s) => s.booked === true);
            setBookedSessions(userBooked);
            return userBooked;
        } catch (err) {
            console.error("Error fetching booked sessions:", err);
            return [];
        } finally {
            setBookingsLoading(false);
        }
    };

    // fetchAllSessions: admin-only call that stores the unfiltered sessions
    // with full attendee details (serializer exposes more info to staff).
    const fetchAllSessions = async () => {
        setAdminLoading(true);
        try {
            const res = await api.get(`/sessions/`);
            setAdminSessions(res.data);
            return res.data;
        } catch (err) {
            console.error("Error fetching all sessions:", err);
            return [];
        } finally {
            setAdminLoading(false);
        }
    };

    // fetchCurrentUser: retrieves the current user profile from the API and
    // caches it to localStorage. This is used to determine admin/staff
    // privileges and render admin-only UI.
    const fetchCurrentUser = async () => {
        try {
            const res = await api.get(`/users/me/`);
            setCurrentUser(res.data);
            localStorage.setItem("currentUser", JSON.stringify(res.data));
            return res.data;
        } catch (err) {
            console.error("Error fetching user:", err);
            return null;
        }
    };

    // handleBook: toggles a booking for the given session on behalf of the
    // current user. After the API mutation we refresh the session lists so
    // the UI can update to reflect the new state.
    const handleBook = async (session) => {
        try {
            const res = await api.post(`/sessions/${session.id}/book/`);
            // Refresh lists
            const refreshed = await fetchSessions();
            await fetchBookedSessions();
            if (currentUser?.is_staff) await fetchAllSessions();
            return { status: res.data.status, refreshed };
        } catch (err) {
            console.error("Error booking session:", err);
            throw err;
        }
    };

    // removeAttendee: admin action to remove a user from a session. After
    // removal we refresh the relevant lists so the UI reflects the change.
    const removeAttendee = async (sessionId, attendeeId) => {
        try {
            await api.post(`/sessions/${sessionId}/remove_attendee/`, { user_id: attendeeId });
            await fetchAllSessions();
            await fetchSessions();
            await fetchBookedSessions();
            return true;
        } catch (err) {
            console.error("Error removing attendee:", err);
            throw err;
        }
    };

    // markAttendance: admin action to toggle attended status for a booking
    const markAttendance = async (sessionId, attendanceId, attended) => {
        try {
            await api.post(`/sessions/${sessionId}/mark_attendance/`, { attendance_id: attendanceId, attended });
            await fetchAllSessions();
            await fetchSessions();
            await fetchBookedSessions();
            return true;
        } catch (err) {
            console.error("Error marking attendance:", err);
            throw err;
        }
    };

    // handleLogout: clears tokens and cached user data and optionally
    // navigates to the login route.
    const handleLogout = (navigate) => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("currentUser");
        if (navigate) navigate("/login");
    };

    return {
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
        handleBook,
        removeAttendee,
        handleLogout,
        markAttendance,
    };
}
