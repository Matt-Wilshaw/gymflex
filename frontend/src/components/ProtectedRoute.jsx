// Import Navigate for redirecting users to a different route
import { Navigate } from "react-router-dom";
// Import jwtDecode for decoding JWT tokens
import jwtDecode from "jwt-decode";
// Import your API helper for making requests
import api from "../api.js";
// Import constants for token storage keys
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants.js";

// ProtectedRoute component ensures that children are only accessible if the user is authorised
function ProtectedRoute({ children }) {
    // State to track whether the user is authorised
    // null = still checking, true = authorised, false = not authorised
    const [isAuthorised, setIsAuthorised] = useState(null);

    // Function to refresh the access token using a stored refresh token
    const refreshToken = async () => {
        // TODO: implement logic to request a new access token from your API
    };

    // Function to check if the user is authenticated
    const auth = async () => {
        // TODO: implement logic to check if the current token is valid
        // Optionally call refreshToken() if token expired
    };

    // While authorisation status is being determined, show a loading indicator
    if (isAuthorised === null) {
        return <div>Loading...</div>;
    }

    // If authorised, render the children (protected content)
    // If not authorised, redirect to the login page
    return isAuthorised ? children : <Navigate to="/login" />;
}

// Export the component so it can be used in other parts of your app
export default ProtectedRoute;
