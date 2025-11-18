import React from "react";
import { useNavigate } from "react-router-dom";
import Timetable from "../components/Timetable";

export default function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Welcome to GymFlex!</h1>
            <p>You are logged in.</p>
            <button onClick={handleLogout} style={{ padding: "10px 20px" }}>
                Logout
            </button>


            <Timetable />
        </div>
    );
}
