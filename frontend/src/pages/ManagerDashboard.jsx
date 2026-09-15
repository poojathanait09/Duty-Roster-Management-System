import ManagerSidebar from "../components/ManagerSidebar";

function ManagerDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <div className="dashboard">

            <ManagerSidebar />

            <main className="main-content">

                <header className="dashboard-header">
                    <div>
                        <h1>Manager Dashboard</h1>
                        <p>Welcome back, {user?.name}</p>
                    </div>
                </header>

                <section className="dashboard-cards">

                    <div className="card">
                        <h3>Employees</h3>
                        <p>Manage department employees</p>
                    </div>

                    <div className="card">
                        <h3>Shifts</h3>
                        <p>Create and manage shifts</p>
                    </div>

                    <div className="card">
                        <h3>Leave Requests</h3>
                        <p>Review employee leaves</p>
                    </div>

                    <div className="card">
                        <h3>Rosters</h3>
                        <p>Generate and manage rosters</p>
                    </div>

                </section>

            </main>

        </div>
    );
}

export default ManagerDashboard;