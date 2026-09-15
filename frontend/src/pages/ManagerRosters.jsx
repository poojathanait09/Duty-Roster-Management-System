import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../components/ManagerSidebar";
import api from "../services/api";

function ManagerRosters() {
    const navigate = useNavigate();

    const [rosters, setRosters] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRosters = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await api("/rosters");
            setRosters(data.rosters);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRosters();
    }, []);

    const createRoster = async (e) => {
        e.preventDefault();

        try {
            setError("");

            await api("/rosters", {
                method: "POST",
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate
                })
            });

            setStartDate("");
            setEndDate("");

            fetchRosters();

        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="dashboard">

            <ManagerSidebar />

            <main className="main-content">

                <div className="dashboard-header">
                    <h1>Rosters</h1>
                    <p>Create and manage department rosters</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="card shift-form-card">

                    <h2>Create Roster</h2>

                    <form
                        className="shift-form"
                        onSubmit={createRoster}
                    >

                        <div>
                            <label>Start Date</label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                                required
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
                                required
                            />
                        </div>

                        <button type="submit">
                            Create Roster
                        </button>

                    </form>

                </div>

                <div className="card">

                    <h2>My Rosters</h2>

                    {loading ? (
                        <p>Loading rosters...</p>
                    ) : rosters.length === 0 ? (
                        <p>No rosters found.</p>
                    ) : (
                        <table className="employee-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {rosters.map((roster) => (
                                    <tr key={roster.id}>

                                        <td>{roster.id}</td>

                                        <td>
                                            {roster.start_date}
                                        </td>

                                        <td>
                                            {roster.end_date}
                                        </td>

                                        <td>
                                            {roster.status}
                                        </td>

                                        <td>
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/manager/rosters/${roster.id}`
                                                    )
                                                }
                                            >
                                                Open
                                            </button>
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

export default ManagerRosters;