const db = require("../config/db");

const getMyRoster = (req, res) => {
    const employeeId = req.user.id;

    const sql = `
        SELECT
            DATE_FORMAT(ra.duty_date, '%Y-%m-%d') AS duty_date,
            s.name AS shift_name,
            s.start_time,
            s.end_time
        FROM roster_assignments ra
        JOIN rosters r
            ON ra.roster_id = r.id
        JOIN shifts s
            ON ra.shift_id = s.id
        WHERE ra.employee_id = ?
        AND r.status = 'PUBLISHED'
        ORDER BY ra.duty_date, s.start_time
    `;

    db.query(sql, [employeeId], (err, assignments) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch roster",
                error: err.message
            });
        }

        res.json({
            assignments
        });
    });
};

module.exports = {
    getMyRoster
};