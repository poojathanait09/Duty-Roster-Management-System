import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import api from "../services/api";

function ManagerEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await api("/manager/employees");
                setEmployees(data.employees);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    return (
        <div className="dashboard">

            <ManagerSidebar />

            <main className="main-content">

                <div className="dashboard-header">
                    <h1>Employees</h1>
                    <p>Employees in your department</p>
                </div>

                {loading && <p>Loading employees...</p>}

                {error && <p>{error}</p>}

                {!loading && !error && (
                    <div className="card">

                        <table className="employee-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                </tr>
                            </thead>

                            <tbody>
                                {employees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>{employee.id}</td>
                                        <td>{employee.name}</td>
                                        <td>{employee.email}</td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>

                        {employees.length === 0 && (
                            <p>No employees found.</p>
                        )}

                    </div>
                )}

            </main>

        </div>
    );
}

export default ManagerEmployees;