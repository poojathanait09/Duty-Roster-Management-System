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

module.exports = {
    createRoster, getRosters, generateRoster
};