const db = require("../config/db");

const applyLeave = (req, res) => {
    const { start_date, end_date, reason } = req.body;

    if (!start_date || !end_date) {
        return res.status(400).json({
            message: "Start date and end date are required"
        });
    }

    const employeeId = req.user.id;

    // Check that the logged-in user is an employee
    const employeeSql = `
        SELECT id
        FROM users
        WHERE id = ?
        AND role = 'EMPLOYEE'
    `;

    db.query(employeeSql, [employeeId], (err, employeeResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (employeeResult.length === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const sql = `
            INSERT INTO leaves
            (employee_id, start_date, end_date, reason)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [employeeId, start_date, end_date, reason || null],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to apply for leave",
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Leave application submitted successfully",
                    leaveId: result.insertId
                });
            }
        );
    });
};

const getMyLeaves = (req, res) => {

    const employeeId = req.user.id;

    const sql = `
        SELECT
            id,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
            reason,
            status
        FROM leaves
        WHERE employee_id = ?
        ORDER BY start_date DESC
    `;

    db.query(sql, [employeeId], (err, leaves) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to fetch leave history",
                error: err.message
            });
        }

        res.json({
            leaves
        });
    });
};
const getDepartmentLeaves = (req, res) => {

    const managerId = req.user.id;

    // Find the manager's department
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [managerId], (err, managerResult) => {

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

        // Get leave requests from employees in this department
        const sql = `
            SELECT
                l.id,
                l.employee_id,
                u.name AS employee_name,
                DATE_FORMAT(l.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(l.end_date, '%Y-%m-%d') AS end_date,
                l.reason,
                l.status
            FROM leaves l
            JOIN users u
                ON l.employee_id = u.id
            WHERE u.department_id = ?
            AND u.role = 'EMPLOYEE'
            ORDER BY l.start_date DESC
        `;

        db.query(sql, [departmentId], (err, leaves) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch leave requests",
                    error: err.message
                });
            }

            res.json({
                leaves
            });
        });
    });
};

const approveLeave = (req, res) => {

    const leaveId = req.params.id;
    const managerId = req.user.id;

    // Find manager's department
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [managerId], (err, managerResult) => {

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

        // Approve only a PENDING leave belonging to this manager's department
        const updateSql = `
            UPDATE leaves l
            JOIN users u
                ON l.employee_id = u.id
            SET l.status = 'APPROVED'
            WHERE l.id = ?
            AND l.status = 'PENDING'
            AND u.department_id = ?
            AND u.role = 'EMPLOYEE'
        `;

        db.query(
            updateSql,
            [leaveId, departmentId],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to approve leave",
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(400).json({
                        message: "Leave request not found or cannot be approved"
                    });
                }

                res.json({
                    message: "Leave approved successfully"
                });
            }
        );
    });
};

const rejectLeave = (req, res) => {

    const leaveId = req.params.id;
    const managerId = req.user.id;

    // Find manager's department
    const managerSql = `
        SELECT department_id
        FROM users
        WHERE id = ?
        AND role = 'MANAGER'
    `;

    db.query(managerSql, [managerId], (err, managerResult) => {

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

        // Reject only a PENDING leave from this manager's department
        const updateSql = `
            UPDATE leaves l
            JOIN users u
                ON l.employee_id = u.id
            SET l.status = 'REJECTED'
            WHERE l.id = ?
            AND l.status = 'PENDING'
            AND u.department_id = ?
            AND u.role = 'EMPLOYEE'
        `;

        db.query(
            updateSql,
            [leaveId, departmentId],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to reject leave",
                        error: err.message
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(400).json({
                        message: "Leave request not found or cannot be rejected"
                    });
                }

                res.json({
                    message: "Leave rejected successfully"
                });
            }
        );
    });
};

module.exports = {
    applyLeave,
    getMyLeaves, getDepartmentLeaves,
     approveLeave,
      rejectLeave
};