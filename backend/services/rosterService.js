const db = require("../config/db");

const getRosterData = (rosterId, managerId, callback) => {

    // Get roster and verify manager's department
    const rosterSql = `
        SELECT
            r.id,
            r.department_id,
            DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date,
            r.status
        FROM rosters r
        JOIN users u
            ON r.department_id = u.department_id
        WHERE r.id = ?
        AND u.id = ?
        AND u.role = 'MANAGER'
    `;

    db.query(rosterSql, [rosterId, managerId], (err, rosterResult) => {

        if (err) {
            return callback(err, null);
        }

        if (rosterResult.length === 0) {
            return callback(null, {
                error: "Roster not found or access denied"
            });
        }

        const roster = rosterResult[0];
        const departmentId = roster.department_id;

        // Get employees
        const employeeSql = `
            SELECT
                id,
                name
            FROM users
            WHERE department_id = ?
            AND role = 'EMPLOYEE'
        `;

        db.query(employeeSql, [departmentId], (err, employees) => {

            if (err) {
                return callback(err, null);
            }

            // Get shifts
            const shiftSql = `
                SELECT
                    id,
                    name,
                    start_time,
                    end_time
                FROM shifts
                WHERE department_id = ?
                ORDER BY start_time
            `;

            db.query(shiftSql, [departmentId], (err, shifts) => {

                if (err) {
                    return callback(err, null);
                }

                // Get approved leaves
                const leaveSql = `
                    SELECT
                        l.employee_id,
                        l.start_date,
                        l.end_date
                    FROM leaves l
                    JOIN users u
                        ON l.employee_id = u.id
                    WHERE u.department_id = ?
                    AND u.role = 'EMPLOYEE'
                    AND l.status = 'APPROVED'
                    AND l.start_date <= ?
                    AND l.end_date >= ?
                `;

                db.query(
                    leaveSql,
                    [
                        departmentId,
                        roster.end_date,
                        roster.start_date
                    ],
                    (err, leaves) => {

                        if (err) {
                            return callback(err, null);
                        }

                       const requirementSql = `
    SELECT
        shift_id,
        required_employees
    FROM shift_requirements
    WHERE shift_id IN (
        SELECT id
        FROM shifts
        WHERE department_id = ?
    )
`;

db.query(
    requirementSql,
    [departmentId],
    (err, requirements) => {

        if (err) {
            return callback(err, null);
        }

        callback(null, {
            roster,
            employees,
            shifts,
            leaves,
            requirements
        });
    }
); 
                    }
                );
            });
        });
    });
};

const generateAssignments = (rosterId, managerId, callback) => {

    getRosterData(rosterId, managerId, (err, data) => {

        if (err) {
            return callback(err, null);
        }

        if (data.error) {
            return callback(null, data);
        }

        const {
            roster,
            employees,
            shifts,
            leaves,
            requirements
        } = data;

        if (roster.status === "PUBLISHED") {
            return callback(null, {
                error: "Published roster cannot be regenerated"
            });
        }

        if (employees.length === 0) {
            return callback(null, {
                error: "No employees available"
            });
        }

        if (shifts.length === 0) {
            return callback(null, {
                error: "No shifts available"
            });
        }

        const requirementMap = {};

        requirements.forEach(req => {
            requirementMap[req.shift_id] = req.required_employees;
        });

        const stats = {};

        employees.forEach(employee => {
            stats[employee.id] = {
                totalDuties: 0,
                nightDuties: 0,
                lastDutyDate: null
            };
        });

        const assignments = [];

        const getDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const isOnLeave = (employeeId, date) => {

            return leaves.some(leave =>
                leave.employee_id === employeeId &&
                date >= leave.start_date &&
                date <= leave.end_date
            );
        };

        const timeToMinutes = (time) => {

            const parts = time.toString().split(":");

            return (
                parseInt(parts[0]) * 60 +
                parseInt(parts[1])
            );
        };

        const shiftsOverlap = (shift1, shift2) => {

            let start1 = timeToMinutes(shift1.start_time);
            let end1 = timeToMinutes(shift1.end_time);

            let start2 = timeToMinutes(shift2.start_time);
            let end2 = timeToMinutes(shift2.end_time);

            if (end1 <= start1) {
                end1 += 1440;
            }

            if (end2 <= start2) {
                end2 += 1440;
            }

            return start1 < end2 && start2 < end1;
        };

        const hasOverlappingShift = (employeeId, date, shift) => {

            return assignments.some(assignment => {

                if (
                    assignment.employee_id !== employeeId ||
                    assignment.duty_date !== date
                ) {
                    return false;
                }

                return shiftsOverlap(
                    assignment.shift,
                    shift
                );
            });
        };

        const getScore = (employeeId, date) => {

            const stat = stats[employeeId];

            let consecutivePenalty = 0;

            if (stat.lastDutyDate) {

                const previous = new Date(stat.lastDutyDate);
                const current = new Date(date);

                const difference =
                    (current - previous) /
                    (1000 * 60 * 60 * 24);

                if (difference === 1) {
                    consecutivePenalty = 15;
                }
            }

            return (
                stat.totalDuties * 10 +
                stat.nightDuties * 20 +
                consecutivePenalty
            );
        };

        let currentDate = new Date(roster.start_date);
        const endDate = new Date(roster.end_date);

        while (currentDate <= endDate) {

            const date = getDateString(currentDate);

            shifts.forEach(shift => {

                const requiredEmployees =
                    requirementMap[shift.id] || 1;

                for (
                    let slot = 0;
                    slot < requiredEmployees;
                    slot++
                ) {

                    const availableEmployees =
                        employees.filter(employee => {

                            if (isOnLeave(employee.id, date)) {
                                return false;
                            }

                            if (
                                hasOverlappingShift(
                                    employee.id,
                                    date,
                                    shift
                                )
                            ) {
                                return false;
                            }

                            return true;
                        });

                    if (availableEmployees.length === 0) {
                        return callback(null, {
                            error:
                                `Not enough available employees for ${shift.name} on ${date}`
                        });
                    }

                    availableEmployees.sort((a, b) => {

                        const aStats = stats[a.id];
                        const bStats = stats[b.id];

                        const isNight =
                            shift.name.toLowerCase().includes("night");

                        if (isNight &&
                            aStats.nightDuties !== bStats.nightDuties) {

                            return (
                                aStats.nightDuties -
                                bStats.nightDuties
                            );
                        }

                        return (
                            getScore(a.id, date) -
                            getScore(b.id, date)
                        );
                    });

                    const selectedEmployee =
                        availableEmployees[0];

                    assignments.push({
                        employee_id: selectedEmployee.id,
                        duty_date: date,
                        shift_id: shift.id,
                        shift
                    });

                    stats[selectedEmployee.id].totalDuties++;

                    if (
                        shift.name
                            .toLowerCase()
                            .includes("night")
                    ) {
                        stats[selectedEmployee.id].nightDuties++;
                    }

                    stats[selectedEmployee.id].lastDutyDate =
                        date;
                }
            });

            currentDate.setDate(
                currentDate.getDate() + 1
            );
        }

        db.query(
            `DELETE FROM roster_assignments
             WHERE roster_id = ?`,
            [rosterId],
            (err) => {

                if (err) {
                    return callback(err, null);
                }

                if (assignments.length === 0) {
                    return callback(null, {
                        error: "No assignments generated"
                    });
                }

                const values = assignments.map(a => [
                    rosterId,
                    a.employee_id,
                    a.shift_id,
                    a.duty_date
                ]);

                const insertSql = `
                    INSERT INTO roster_assignments
                    (roster_id, employee_id, shift_id, duty_date)
                    VALUES ?
                `;

                db.query(
                    insertSql,
                    [values],
                    (err) => {

                        if (err) {
                            return callback(err, null);
                        }

                        callback(null, {
                            message:
                                "Roster generated successfully",
                            rosterId,
                            assignments: assignments.map(a => ({
                                employee_id: a.employee_id,
                                duty_date: a.duty_date,
                                shift_id: a.shift_id
                            }))
                        });
                    }
                );
            }
        );
    });
};

module.exports = {
    getRosterData,
    generateAssignments
};

