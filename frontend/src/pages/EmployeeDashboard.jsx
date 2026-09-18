import { useEffect, useState } from "react";
import api from "../services/api";

function EmployeeDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRoster = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await api("/employee/roster");

            setAssignments(data.assignments);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/";
    };

    if (loading) {
        return <p>Loading your roster...</p>;
    }

    return (
        <div className="dashboard">

            <aside className="sidebar">
                <h2>Smart Duty Roster</h2>

                <nav>
                    <a href="/employee">My Roster</a>
                </nav>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </aside>

            <main className="main-content">

                <div className="dashboard-header">
                    <h1>Employee Dashboard</h1>

                    <p>
                        Welcome, {user?.name}
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="card">

                    <h2>My Published Roster</h2>

                    {assignments.length === 0 ? (
                        <p>
                            No published roster is available for you yet.
                        </p>
                    ) : (
                        <table className="employee-table">

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Shift</th>
                                    <th>Time</th>
                                </tr>
                            </thead>

                            <tbody>
                                {assignments.map((assignment, index) => (
                                    <tr key={index}>

                                        <td>
                                            {assignment.duty_date}
                                        </td>

                                        <td>
                                            {assignment.shift_name}
                                        </td>

                                        <td>
                                            {assignment.start_time}
                                            {" - "}
                                            {assignment.end_time}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    )}

                </div>

            </main>
        </div>
    );
}

export default EmployeeDashboard;