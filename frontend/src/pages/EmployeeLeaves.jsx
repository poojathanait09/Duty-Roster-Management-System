import { useEffect, useState } from "react";
import api from "../services/api";

function EmployeeLeaves() {
    const [leaves, setLeaves] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await api("/leaves/my");

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

    const applyLeave = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            if (!startDate || !endDate) {
                throw new Error("Please select both dates.");
            }

            if (startDate > endDate) {
                throw new Error(
                    "Start date cannot be after end date."
                );
            }

            await api("/leaves/", {
                method: "POST",
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                    reason
                })
            });

            setSuccess("Leave request submitted successfully.");

            setStartDate("");
            setEndDate("");
            setReason("");

            await fetchLeaves();

        } catch (error) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/";
    };

    if (loading) {
        return <p>Loading leave requests...</p>;
    }

    return (
        <div className="dashboard">

            <aside className="sidebar">
                <h2>Smart Duty Roster</h2>

                <nav>
                    <a href="/employee">My Roster</a>
                    <a href="/employee/leaves">My Leaves</a>
                </nav>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </aside>

            <main className="main-content">

                <div className="dashboard-header">
                    <h1>My Leaves</h1>
                    <p>Apply for leave and view your leave history.</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                <div className="card shift-form-card">

                    <h2>Apply for Leave</h2>

                    <form
                        className="shift-form"
                        onSubmit={applyLeave}
                    >

                        <div>
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label>Reason</label>
                            <input
                                type="text"
                                placeholder="Reason"
                                value={reason}
                                onChange={(e) =>
                                    setReason(e.target.value)
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Submitting..."
                                : "Apply Leave"}
                        </button>

                    </form>

                </div>

                <div className="card">

                    <h2>Leave History</h2>

                    {leaves.length === 0 ? (
                        <p>No leave requests found.</p>
                    ) : (
                        <table className="employee-table">

                            <thead>
                                <tr>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave.id}>
                                        <td>{leave.start_date}</td>
                                        <td>{leave.end_date}</td>
                                        <td>{leave.reason}</td>
                                        <td>{leave.status}</td>
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

export default EmployeeLeaves;