import axios from "axios";
// Corrected path assuming both are in the same 'src' directory
import { ACCESS_TOKEN } from "./constants.js";

// Create an Axios instance with the base URL for the Django API
// NOTE: You must set VITE_API_URL in your .env file (e.g., http://localhost:8000/api)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request Interceptor: Automatically attach the JWT Access Token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            // Format required by Django Simple JWT: 'Bearer <token>'
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;