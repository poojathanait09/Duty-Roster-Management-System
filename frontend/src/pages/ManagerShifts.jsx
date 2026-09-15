import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import api from "../services/api";

function ManagerShifts() {
    const [shifts, setShifts] = useState([]);
    const [requirements, setRequirements] = useState([]);

    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [shiftData, requirementData] = await Promise.all([
                api("/manager/shifts"),
                api("/manager/shift-requirements")
            ]);

            setShifts(shiftData.shifts);
            setRequirements(requirementData.requirements);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setName("");
        setStartTime("");
        setEndTime("");
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            if (editingId) {
                await api(`/manager/shifts/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        name,
                        start_time: startTime,
                        end_time: endTime
                    })
                });
            } else {
                await api("/manager/shifts", {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        start_time: startTime,
                        end_time: endTime
                    })
                });
            }

            resetForm();
            fetchData();

        } catch (error) {
            setError(error.message);
        }
    };

    const handleEdit = (shift) => {
        setEditingId(shift.id);
        setName(shift.name);
        setStartTime(shift.start_time);
        setEndTime(shift.end_time);
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this shift?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api(`/manager/shifts/${id}`, {
                method: "DELETE"
            });

            fetchData();

        } catch (error) {
            setError(error.message);
        }
    };

    const getRequirement = (shiftId) => {
        const requirement = requirements.find(
            (item) => item.shift_id === shiftId
        );

        return requirement
            ? requirement.required_employees
            : 1;
    };

    const updateRequirement = async (shiftId, value) => {
        try {
            setError("");

            await api(`/manager/shifts/${shiftId}/requirement`, {
                method: "PUT",
                body: JSON.stringify({
                    required_employees: Number(value)
                })
            });

            fetchData();

        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="dashboard">

            <ManagerSidebar />

            <main className="main-content">

                <div className="dashboard-header">
                    <h1>Shifts</h1>
                    <p>Manage department shifts and staffing requirements</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="card shift-form-card">

                    <h2>
                        {editingId
                            ? "Edit Shift"
                            : "Create Shift"}
                    </h2>

                    <form
                        className="shift-form"
                        onSubmit={handleSubmit}
                    >

                        <input
                            type="text"
                            placeholder="Shift name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />

                        <div>
                            <label>Start Time</label>

                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) =>
                                    setStartTime(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <label>End Time</label>

                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) =>
                                    setEndTime(e.target.value)
                                }
                                required
                            />
                        </div>

                        <button type="submit">
                            {editingId
                                ? "Update Shift"
                                : "Create Shift"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}

                    </form>

                </div>

                <div className="card">

                    <h2>Department Shifts</h2>

                    {loading ? (
                        <p>Loading shifts...</p>
                    ) : (
                        <table className="employee-table">

                            <thead>
                                <tr>
                                    <th>Shift</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Required Employees</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {shifts.map((shift) => (

                                    <tr key={shift.id}>

                                        <td>
                                            {shift.name}
                                        </td>

                                        <td>
                                            {shift.start_time}
                                        </td>

                                        <td>
                                            {shift.end_time}
                                        </td>

                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={getRequirement(
                                                    shift.id
                                                )}
                                                onChange={(e) =>
                                                    updateRequirement(
                                                        shift.id,
                                                        e.target.value
                                                    )
                                                }
                                                style={{
                                                    width: "70px"
                                                }}
                                            />
                                        </td>

                                        <td>

                                            <button
                                                onClick={() =>
                                                    handleEdit(shift)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        shift.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>
                    )}

                    {!loading && shifts.length === 0 && (
                        <p>No shifts found.</p>
                    )}

                </div>

            </main>

        </div>
    );
}

export default ManagerShifts;