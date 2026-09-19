import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ManagerEmployees from "./pages/ManagerEmployees";
import ManagerShifts from "./pages/ManagerShifts";
import ManagerLeaves from "./pages/ManagerLeaves";
import ManagerRosters from "./pages/ManagerRosters";
import RosterDetails from "./pages/RosterDetails";
import EmployeeLeaves from "./pages/EmployeeLeaves";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Login />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRole="ADMIN">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute allowedRole="MANAGER">
                            <ManagerDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee"
                    element={
                        <ProtectedRoute allowedRole="EMPLOYEE">
                            <EmployeeDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager/employees"
                    element={
                        <ProtectedRoute allowedRole="MANAGER">
                            <ManagerEmployees />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager/shifts"
                    element={
                        <ProtectedRoute allowedRole="MANAGER">
                            <ManagerShifts />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager/leaves"
                    element={
                        <ProtectedRoute allowedRole="MANAGER">
                            <ManagerLeaves />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager/rosters"
                    element={
                        <ProtectedRoute allowedRole="MANAGER">
                            <ManagerRosters />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/manager/rosters/:id"
                    element={
                        <ProtectedRoute allowedRole="MANAGER">
                            <RosterDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee/leaves"
                    element={
                        <ProtectedRoute allowedRole="EMPLOYEE">
                            <EmployeeLeaves />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;