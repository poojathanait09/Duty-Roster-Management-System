import { Link, useNavigate } from "react-router-dom";

function ManagerSidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
    };

    return (
        <aside className="sidebar">
            <h2>Smart Duty Roster</h2>

            <nav>
                <Link to="/manager">Dashboard</Link>
                <Link to="/manager/employees">Employees</Link>
                <Link to="/manager/shifts">Shifts</Link>
                <Link to="/manager/leaves">Leave Requests</Link>
                <Link to="/manager/requirements">Staffing Requirements</Link>
                <Link to="/manager/rosters">Rosters</Link>
            </nav>

            <button onClick={handleLogout}>
                Logout
            </button>
        </aside>
    );
}

export default ManagerSidebar;