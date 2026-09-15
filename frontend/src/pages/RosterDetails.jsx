import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ManagerSidebar from "../components/ManagerSidebar";
import api from "../services/api";

function RosterDetails() {
    const { id } = useParams();

    const [roster, setRoster] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchRoster = async () => {
        try {
            setLoading(true);
            setError("");

            const rosterData = await api("/rosters");

            const selectedRoster = rosterData.rosters.find(
                (item) => String(item.id) === String(id)
            );

            if (!selectedRoster) {
                throw new Error("Roster not found");
            }

            setRoster(selectedRoster);

            const assignmentData =
                await api(`/rosters/${id}/assignments`);

            setAssignments(assignmentData.assignments);

            const employeeData =
                await api("/manager/employees");

            setEmployees(employeeData.employees);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, [id]);

    const generateRoster = async () => {
        try {
            setGenerating(true);
            setError("");
            setSuccess("");

            await api(`/rosters/${id}/generate`, {
                method: "POST"
            });

            setSuccess("Roster generated successfully.");

            await fetchRoster();

        } catch (error) {
            setError(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const startEditing = (assignment) => {
        setEditingId(assignment.id);
        setSelectedEmployee(String(assignment.employee_id));
        setError("");
        setSuccess("");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setSelectedEmployee("");
    };

    const saveAssignment = async (assignmentId) => {
        if (!selectedEmployee) {
            setError("Please select an employee.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api(
                `/rosters/${id}/assignments/${assignmentId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        employee_id: Number(selectedEmployee)
                    })
                }
            );

            setSuccess("Roster assignment updated successfully.");

            setEditingId(null);
            setSelectedEmployee("");

            await fetchRoster();

        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p>Loading roster...</p>;
    }

    return (
        <div className="dashboard">
            <ManagerSidebar />

            <main className="main-content">

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

                {roster && (
                    <>
                        <div className="dashboard-header">
                            <h1>Roster #{roster.id}</h1>

                            <p>
                                {roster.start_date} → {roster.end_date}
                            </p>

                            <p>
                                Status:{" "}
                                <strong>{roster.status}</strong>
                            </p>
                        </div>

                        {roster.status === "DRAFT" && (
                            <div className="card roster-actions">
                                <button
                                    onClick={generateRoster}
                                    disabled={generating}
                                >
                                    {generating
                                        ? "Generating..."
                                        : "Generate Roster"}
                                </button>
                            </div>
                        )}

                        <div className="card">
                            <h2>Assignments</h2>

                            {assignments.length === 0 ? (
                                <p>
                                    No assignments yet.
                                    Generate the roster to create
                                    assignments.
                                </p>
                            ) : (
                                <table className="employee-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Shift</th>
                                            <th>Time</th>
                                            <th>Employee</th>

                                            {roster.status === "DRAFT" && (
                                                <th>Actions</th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {assignments.map((assignment) => (
                                            <tr key={assignment.id}>

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

                                                <td>
                                                    {editingId === assignment.id ? (
                                                        <select
                                                            value={selectedEmployee}
                                                            onChange={(e) =>
                                                                setSelectedEmployee(
                                                                    e.target.value
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Select employee
                                                            </option>

                                                            {employees.map(
                                                                (employee) => (
                                                                    <option
                                                                        key={
                                                                            employee.id
                                                                        }
                                                                        value={
                                                                            employee.id
                                                                        }
                                                                    >
                                                                        {
                                                                            employee.name
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    ) : (
                                                        assignment.employee_name
                                                    )}
                                                </td>

                                                {roster.status === "DRAFT" && (
                                                    <td>
                                                        {editingId === assignment.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        saveAssignment(
                                                                            assignment.id
                                                                        )
                                                                    }
                                                                    disabled={saving}
                                                                >
                                                                    {saving
                                                                        ? "Saving..."
                                                                        : "Save"}
                                                                </button>

                                                                <button
                                                                    onClick={
                                                                        cancelEditing
                                                                    }
                                                                    disabled={saving}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    startEditing(
                                                                        assignment
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </td>
                                                )}

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

            </main>
        </div>
    );
}

export default RosterDetails;