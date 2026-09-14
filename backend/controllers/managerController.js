const db = require("../config/db");

// Manager can view only employees from their own department
const getDepartmentEmployees = (req, res) => {

    // Get department of logged-in manager
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [req.user.id], (err, managerResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (managerResult.length === 0) {
            return res.status(404).json({
                message: "Manager not found"
            });
        }

        const departmentId = managerResult[0].department_id;

        const employeeSql = `
            SELECT
                id,
                name,
                email,
                department_id
            FROM users
            WHERE role = 'EMPLOYEE'
            AND department_id = ?
        `;

        db.query(employeeSql, [departmentId], (err, employees) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch employees",
                    error: err.message
                });
            }

            res.json({
                departmentId,
                totalEmployees: employees.length,
                employees
            });
        });
    });
};

const createShift = (req, res) => {
    const { name, start_time, end_time } = req.body;

    if (!name || !start_time || !end_time) {
        return res.status(400).json({
            message: "Name, start time and end time are required"
        });
    }

    // Get manager's department
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [req.user.id], (err, managerResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (managerResult.length === 0) {
            return res.status(404).json({
                message: "Manager not found"
            });
        }

        const departmentId = managerResult[0].department_id;

        if (!departmentId) {
            return res.status(400).json({
                message: "Manager is not assigned to a department"
            });
        }

        const sql = `
            INSERT INTO shifts
            (department_id, name, start_time, end_time)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [departmentId, name, start_time, end_time],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to create shift",
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Shift created successfully",
                    shiftId: result.insertId
                });
            }
        );
    });
};

const getShifts = (req, res) => {

    // Get manager's department
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [req.user.id], (err, managerResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (managerResult.length === 0) {
            return res.status(404).json({
                message: "Manager not found"
            });
        }

        const departmentId = managerResult[0].department_id;

        if (!departmentId) {
            return res.status(400).json({
                message: "Manager is not assigned to a department"
            });
        }

        const sql = `
            SELECT
                id,
                name,
                start_time,
                end_time
            FROM shifts
            WHERE department_id = ?
            ORDER BY start_time
        `;

        db.query(sql, [departmentId], (err, shifts) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch shifts",
                    error: err.message
                });
            }

            res.json({
                departmentId,
                shifts
            });
        });
    });
};

const updateShift = (req, res) => {
    const shiftId = req.params.id;
    const { name, start_time, end_time } = req.body;

    if (!name || !start_time || !end_time) {
        return res.status(400).json({
            message: "Name, start time and end time are required"
        });
    }

    // Get manager's department
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [req.user.id], (err, managerResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (managerResult.length === 0) {
            return res.status(404).json({
                message: "Manager not found"
            });
        }

        const departmentId = managerResult[0].department_id;

        const updateSql = `
            UPDATE shifts
            SET name = ?, start_time = ?, end_time = ?
            WHERE id = ?
            AND department_id = ?
        `;

        db.query(
            updateSql,
            [name, start_time, end_time, shiftId, departmentId],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to update shift",
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Shift not found"
                    });
                }

                res.json({
                    message: "Shift updated successfully"
                });
            }
        );
    });
};

const deleteShift = (req, res) => {
    const shiftId = req.params.id;

    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [req.user.id], (err, managerResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (managerResult.length === 0) {
            return res.status(404).json({
                message: "Manager not found"
            });
        }

        const departmentId = managerResult[0].department_id;

        const deleteSql = `
            DELETE FROM shifts
            WHERE id = ?
            AND department_id = ?
        `;

        db.query(
            deleteSql,
            [shiftId, departmentId],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to delete shift",
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Shift not found"
                    });
                }

                res.json({
                    message: "Shift deleted successfully"
                });
            }
        );
    });
};

const setShiftRequirement = (req, res) => {
    const shiftId = req.params.id;
    const managerId = req.user.id;
    const { required_employees } = req.body;

    if (!required_employees || required_employees < 1) {
        return res.status(400).json({
            message: "Required employees must be at least 1"
        });
    }

    const sql = `
        INSERT INTO shift_requirements
        (shift_id, required_employees)
        SELECT ?, ?
        FROM shifts s
        JOIN users u
            ON s.department_id = u.department_id
        WHERE s.id = ?
        AND u.id = ?
        AND u.role = 'MANAGER'
        ON DUPLICATE KEY UPDATE
        required_employees = VALUES(required_employees)
    `;

    db.query(
        sql,
        [shiftId, required_employees, shiftId, managerId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to set shift requirement",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Shift not found or access denied"
                });
            }

            res.json({
                message: "Shift requirement updated successfully",
                shiftId,
                required_employees
            });
        }
    );
};

const getShiftRequirements = (req, res) => {
    const managerId = req.user.id;

    const sql = `
        SELECT
            s.id AS shift_id,
            s.name AS shift_name,
            s.start_time,
            s.end_time,
            COALESCE(sr.required_employees, 1) AS required_employees
        FROM shifts s
        JOIN users u
            ON s.department_id = u.department_id
        LEFT JOIN shift_requirements sr
            ON s.id = sr.shift_id
        WHERE u.id = ?
        AND u.role = 'MANAGER'
        ORDER BY s.start_time
    `;

    db.query(sql, [managerId], (err, requirements) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch shift requirements",
                error: err.message
            });
        }

        res.json({
            requirements
        });
    });
};


module.exports = {
    getDepartmentEmployees, createShift, getShifts, updateShift, deleteShift,
    setShiftRequirement,
    getShiftRequirements
};