import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import api from "../services/api";

function ManagerLeaves() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await api("/leaves/manager");
            setLeaves(data.leaves);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const updateLeave = async (id, action) => {
        try {
            setError("");

            await api(`/leaves/manager/${id}/${action}`, {
                method: "PUT"
            });

            fetchLeaves();
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="dashboard">

            <ManagerSidebar />

            <main className="main-content">

                <div className="dashboard-header">
                    <h1>Leave Requests</h1>
                    <p>Review employee leave applications</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="card">

                    {loading ? (
                        <p>Loading leave requests...</p>
                    ) : leaves.length === 0 ? (
                        <p>No leave requests found.</p>
                    ) : (
                        <table className="employee-table">

                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {leaves.map((leave) => (
                                    <tr key={leave.id}>

                                        <td>
                                            {leave.employee_name}
                                        </td>

                                        <td>
                                            {leave.start_date}
                                        </td>

                                        <td>
                                            {leave.end_date}
                                        </td>

                                        <td>
                                            {leave.reason || "-"}
                                        </td>

                                        <td>
                                            {leave.status}
                                        </td>

                                        <td>

                                            {leave.status === "PENDING" && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            updateLeave(
                                                                leave.id,
                                                                "approve"
                                                            )
                                                        }
                                                    >
                                                        Approve
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            updateLeave(
                                                                leave.id,
                                                                "reject"
                                                            )
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

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

export default ManagerLeaves;