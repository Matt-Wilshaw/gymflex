// Import the axios library for making HTTP requests
import axios from "axios";

// Import a constant representing the key used for storing the access token in localStorage
import { ACCESS_TOKEN } from "./constants.js";

// Create an instance of axios with a default base URL
// The base URL is read from environment variables (Vite project)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL // e.g., "http://localhost:8000/api"
});

// Add a request interceptor to automatically include the Authorization header
// This runs before every request made with this axios instance
api.interceptors.request.use(
    (config) => {
        // Get the access token from localStorage
        const token = localStorage.getItem(ACCESS_TOKEN);

        // If a token exists, attach it to the request headers
        // as a Bearer token for JWT authorisation
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        // Return the updated config to continue the request
        return config;
    },
    (error) => {
        // If there was an error setting up the request, reject the promise
        return Promise.reject(error);
    }
);

// Export the configured axios instance so it can be used throughout the project
export default api;
