import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRole, children }) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        return <Navigate to="/" replace />;
    }

    if (user.role !== allowedRole) {
        if (user.role === "ADMIN") {
            return <Navigate to="/admin" replace />;
        }

        if (user.role === "MANAGER") {
            return <Navigate to="/manager" replace />;
        }

        if (user.role === "EMPLOYEE") {
            return <Navigate to="/employee" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;