const db = require("../config/db");

const { getRosterData,  generateAssignments } = require("../services/rosterService");

const createRoster = (req, res) => {

    const managerId = req.user.id;
    const { start_date, end_date } = req.body;

    // Validate dates
    if (!start_date || !end_date) {
        return res.status(400).json({
            message: "Start date and end date are required"
        });
    }

    if (start_date > end_date) {
        return res.status(400).json({
            message: "Start date cannot be after end date"
        });
    }

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

        if (!departmentId) {
            return res.status(400).json({
                message: "Manager is not assigned to a department"
            });
        }

        // Create roster
        const sql = `
            INSERT INTO rosters
            (department_id, start_date, end_date, status)
            VALUES (?, ?, ?, 'DRAFT')
        `;

        db.query(
            sql,
            [departmentId, start_date, end_date],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to create roster",
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Roster created successfully",
                    rosterId: result.insertId,
                    departmentId: departmentId,
                    start_date,
                    end_date,
                    status: "DRAFT"
                });
            }
        );
    });
};

const getRosters = (req, res) => {

    const managerId = req.user.id;

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

        const sql = `
            SELECT
                id,
                department_id,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                status
            FROM rosters
            WHERE department_id = ?
            ORDER BY start_date DESC
        `;

        db.query(sql, [departmentId], (err, rosters) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch rosters",
                    error: err.message
                });
            }

            res.json({
                rosters
            });
        });
    });
};

const getRosterAssignments = (req, res) => {

    const rosterId = req.params.id;
    const managerId = req.user.id;

    const sql = `
        SELECT
            ra.id,
            DATE_FORMAT(ra.duty_date, '%Y-%m-%d') AS duty_date,
            ra.employee_id,
            u.name AS employee_name,
            ra.shift_id,
            s.name AS shift_name,
            s.start_time,
            s.end_time
        FROM roster_assignments ra
        JOIN rosters r
            ON ra.roster_id = r.id
        JOIN users u
            ON ra.employee_id = u.id
        JOIN shifts s
            ON ra.shift_id = s.id
        JOIN users m
            ON r.department_id = m.department_id
        WHERE ra.roster_id = ?
        AND m.id = ?
        AND m.role = 'MANAGER'
        ORDER BY ra.duty_date, s.start_time
    `;

    db.query(sql, [rosterId, managerId], (err, assignments) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to fetch roster assignments",
                error: err.message
            });
        }

        res.json({
            rosterId,
            assignments
        });
    });
};

const generateRoster = (req, res) => {

    const rosterId = req.params.id;
    const managerId = req.user.id;

    generateAssignments(rosterId, managerId, (err, data) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to generate roster",
                error: err.message
            });
        }

        if (data.error) {
            return res.status(400).json({
                message: data.error
            });
        }

        res.status(201).json(data);
    });
};

const updateRosterAssignment = (req, res) => {

    const rosterId = req.params.rosterId;
    const assignmentId = req.params.assignmentId;
    const managerId = req.user.id;
    const { employee_id } = req.body;

    if (!employee_id) {
        return res.status(400).json({
            message: "Employee ID is required"
        });
    }

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

        const assignmentSql = `
            SELECT
                ra.id,
                DATE_FORMAT(ra.duty_date, '%Y-%m-%d') AS duty_date,
                ra.shift_id,
                r.department_id,
                r.status
            FROM roster_assignments ra
            JOIN rosters r
                ON ra.roster_id = r.id
            WHERE ra.id = ?
            AND ra.roster_id = ?
            AND r.department_id = ?
        `;

        db.query(
            assignmentSql,
            [assignmentId, rosterId, departmentId],
            (err, assignmentResult) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                if (assignmentResult.length === 0) {
                    return res.status(404).json({
                        message: "Assignment not found or access denied"
                    });
                }

                const assignment = assignmentResult[0];

                if (assignment.status === "PUBLISHED") {
                    return res.status(400).json({
                        message: "Published roster cannot be edited"
                    });
                }

                // Check new employee
                const employeeSql = `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    AND department_id = ?
                    AND role = 'EMPLOYEE'
                `;

                db.query(
                    employeeSql,
                    [employee_id, departmentId],
                    (err, employeeResult) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error",
                                error: err.message
                            });
                        }

                        if (employeeResult.length === 0) {
                            return res.status(400).json({
                                message: "Employee does not belong to this department"
                            });
                        }

                        // Check approved leave
                        const leaveSql = `
                            SELECT id
                            FROM leaves
                            WHERE employee_id = ?
                            AND status = 'APPROVED'
                            AND start_date <= ?
                            AND end_date >= ?
                        `;

                        db.query(
                            leaveSql,
                            [
                                employee_id,
                                assignment.duty_date,
                                assignment.duty_date
                            ],
                            (err, leaveResult) => {

                                if (err) {
                                    return res.status(500).json({
                                        message: "Database error",
                                        error: err.message
                                    });
                                }

                                if (leaveResult.length > 0) {
                                    return res.status(400).json({
                                        message: "Employee is on approved leave on this date"
                                    });
                                }

                                // Check overlapping shift
                                const overlapSql = `
                                    SELECT
                                        ra.id,
                                        s.start_time,
                                        s.end_time
                                    FROM roster_assignments ra
                                    JOIN shifts s
                                        ON ra.shift_id = s.id
                                    WHERE ra.roster_id = ?
                                    AND ra.employee_id = ?
                                    AND ra.duty_date = ?
                                    AND ra.id != ?
                                `;

                                db.query(
                                    overlapSql,
                                    [
                                        rosterId,
                                        employee_id,
                                        assignment.duty_date,
                                        assignmentId
                                    ],
                                    (err, existingAssignments) => {

                                        if (err) {
                                            return res.status(500).json({
                                                message: "Database error",
                                                error: err.message
                                            });
                                        }

                                        const timeToMinutes = (time) => {

                                            const parts = time
                                                .toString()
                                                .split(":");

                                            return (
                                                parseInt(parts[0]) * 60 +
                                                parseInt(parts[1])
                                            );
                                        };

                                        const shiftsOverlap = (
                                            start1,
                                            end1,
                                            start2,
                                            end2
                                        ) => {

                                            start1 = timeToMinutes(start1);
                                            end1 = timeToMinutes(end1);
                                            start2 = timeToMinutes(start2);
                                            end2 = timeToMinutes(end2);

                                            if (end1 <= start1) {
                                                end1 += 1440;
                                            }

                                            if (end2 <= start2) {
                                                end2 += 1440;
                                            }

                                            return (
                                                start1 < end2 &&
                                                start2 < end1
                                            );
                                        };

                                        const shiftSql = `
                                            SELECT
                                                start_time,
                                                end_time
                                            FROM shifts
                                            WHERE id = ?
                                        `;

                                        db.query(
                                            shiftSql,
                                            [assignment.shift_id],
                                            (err, currentShiftResult) => {

                                                if (err) {
                                                    return res.status(500).json({
                                                        message: "Database error",
                                                        error: err.message
                                                    });
                                                }

                                                const currentShift =
                                                    currentShiftResult[0];

                                                const hasOverlap =
                                                    existingAssignments.some(
                                                        existing =>
                                                            shiftsOverlap(
                                                                currentShift.start_time,
                                                                currentShift.end_time,
                                                                existing.start_time,
                                                                existing.end_time
                                                            )
                                                    );

                                                if (hasOverlap) {
                                                    return res.status(400).json({
                                                        message: "Employee already has an overlapping shift on this date"
                                                    });
                                                }

                                                const updateSql = `
                                                    UPDATE roster_assignments
                                                    SET employee_id = ?
                                                    WHERE id = ?
                                                    AND roster_id = ?
                                                `;

                                                db.query(
                                                    updateSql,
                                                    [
                                                        employee_id,
                                                        assignmentId,
                                                        rosterId
                                                    ],
                                                    (err) => {

                                                        if (err) {
                                                            return res.status(500).json({
                                                                message: "Failed to update roster assignment",
                                                                error: err.message
                                                            });
                                                        }

                                                        res.json({
                                                            message: "Roster assignment updated successfully",
                                                            assignmentId,
                                                            employee_id
                                                        });
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};

const publishRoster = (req, res) => {
    const rosterId = req.params.id;
    const managerId = req.user.id;

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

        const rosterSql = `
            SELECT id, status
            FROM rosters
            WHERE id = ?
            AND department_id = ?
        `;

        db.query(
            rosterSql,
            [rosterId, departmentId],
            (err, rosterResult) => {
                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                if (rosterResult.length === 0) {
                    return res.status(404).json({
                        message: "Roster not found or access denied"
                    });
                }

                const roster = rosterResult[0];

                if (roster.status === "PUBLISHED") {
                    return res.status(400).json({
                        message: "Roster is already published"
                    });
                }

                const assignmentSql = `
                    SELECT COUNT(*) AS count
                    FROM roster_assignments
                    WHERE roster_id = ?
                `;

                db.query(
                    assignmentSql,
                    [rosterId],
                    (err, assignmentResult) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Database error",
                                error: err.message
                            });
                        }

                        if (assignmentResult[0].count === 0) {
                            return res.status(400).json({
                                message: "Cannot publish an empty roster"
                            });
                        }

                        const updateSql = `
                            UPDATE rosters
                            SET status = 'PUBLISHED'
                            WHERE id = ?
                            AND department_id = ?
                        `;

                        db.query(
                            updateSql,
                            [rosterId, departmentId],
                            (err) => {
                                if (err) {
                                    return res.status(500).json({
                                        message: "Failed to publish roster",
                                        error: err.message
                                    });
                                }

                                res.json({
                                    message: "Roster published successfully",
                                    rosterId
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};

module.exports = {
    createRoster, getRosters, generateRoster, getRosterAssignments,
    updateRosterAssignment, publishRoster
};