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

                        callback(null, {
                            roster,
                            employees,
                            shifts,
                            leaves
                        });
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

        const { roster, employees, shifts, leaves } = data;

        if (roster.status === "PUBLISHED") {
            return callback(null, {
                error: "Published roster cannot be regenerated"
            });
        }

        if (employees.length === 0) {
            return callback(null, {
                error: "No employees found in this department"
            });
        }

        if (shifts.length === 0) {
            return callback(null, {
                error: "No shifts found in this department"
            });
        }

        const assignments = [];

        const employeeStats = {};

        employees.forEach(employee => {
            employeeStats[employee.id] = {
                totalDuties: 0,
                nightDuties: 0,
                lastDutyDate: null,
                consecutiveDays: 0
            };
        });

        const isOnLeave = (employeeId, date) => {

            return leaves.some(leave => {

                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                const current = new Date(date);

                return (
                    leave.employee_id === employeeId &&
                    current >= start &&
                    current <= end
                );
            });
        };

        const hasOverlappingShift = (employeeId, date, shift) => {

            return assignments.some(assignment => {

                if (
                    assignment.employee_id !== employeeId ||
                    assignment.duty_date !== date
                ) {
                    return false;
                }

                const existingShift = shifts.find(
                    s => s.id === assignment.shift_id
                );

                if (!existingShift) {
                    return false;
                }

                return shiftsOverlap(existingShift, shift);
            });
        };

        const shiftsOverlap = (shift1, shift2) => {

            const start1 = timeToMinutes(shift1.start_time);
            const end1 = timeToMinutes(shift1.end_time);

            const start2 = timeToMinutes(shift2.start_time);
            const end2 = timeToMinutes(shift2.end_time);

            const adjustedEnd1 = end1 <= start1 ? end1 + 1440 : end1;
            const adjustedEnd2 = end2 <= start2 ? end2 + 1440 : end2;

            return (
                start1 < adjustedEnd2 &&
                start2 < adjustedEnd1
            );
        };

        const timeToMinutes = (time) => {

            const parts = time.toString().split(":");

            return (
                parseInt(parts[0]) * 60 +
                parseInt(parts[1])
            );
        };

        const getDateString = (date) => {

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const getNextDate = (date) => {

            const next = new Date(date);

            next.setDate(next.getDate() + 1);

            return next;
        };

        let currentDate = new Date(roster.start_date);
        const endDate = new Date(roster.end_date);

        while (currentDate <= endDate) {

            const dutyDate = getDateString(currentDate);

            for (const shift of shifts) {

                const availableEmployees = employees.filter(employee => {

                    if (isOnLeave(employee.id, dutyDate)) {
                        return false;
                    }

                    if (
                        hasOverlappingShift(
                            employee.id,
                            dutyDate,
                            shift
                        )
                    ) {
                        return false;
                    }

                    return true;
                });

                if (availableEmployees.length === 0) {
                    return callback(null, {
                        error: `No available employee for ${shift.name} on ${dutyDate}`
                    });
                }

                availableEmployees.sort((a, b) => {

                    const statsA = employeeStats[a.id];
                    const statsB = employeeStats[b.id];

                    const isNightShift = shift.name.toLowerCase().includes("night");

                    if (isNightShift) {

                        if (statsA.nightDuties !== statsB.nightDuties) {
                            return statsA.nightDuties - statsB.nightDuties;
                        }
                    }

                    const scoreA =
                        statsA.totalDuties * 10 +
                        statsA.nightDuties * 20 +
                        statsA.consecutiveDays * 15;

                    const scoreB =
                        statsB.totalDuties * 10 +
                        statsB.nightDuties * 20 +
                        statsB.consecutiveDays * 15;

                    return scoreA - scoreB;
                });

                const selectedEmployee = availableEmployees[0];

                assignments.push({
                    employee_id: selectedEmployee.id,
                    shift_id: shift.id,
                    duty_date: dutyDate
                });

                const stats = employeeStats[selectedEmployee.id];

                stats.totalDuties++;

                if (shift.name.toLowerCase().includes("night")) {
                    stats.nightDuties++;
                }

                if (stats.lastDutyDate) {

                    const previousDate = new Date(stats.lastDutyDate);
                    const current = new Date(dutyDate);

                    const difference =
                        (current - previousDate) /
                        (1000 * 60 * 60 * 24);

                    if (difference === 1) {
                        stats.consecutiveDays++;
                    } else {
                        stats.consecutiveDays = 0;
                    }
                }

                stats.lastDutyDate = dutyDate;
            }

            currentDate = getNextDate(currentDate);
        }

        // Remove previous draft assignments
        const deleteSql = `
            DELETE FROM roster_assignments
            WHERE roster_id = ?
        `;

        db.query(deleteSql, [rosterId], (err) => {

            if (err) {
                return callback(err, null);
            }

            if (assignments.length === 0) {
                return callback(null, {
                    error: "No assignments generated"
                });
            }

            const insertSql = `
                INSERT INTO roster_assignments
                (roster_id, employee_id, shift_id, duty_date)
                VALUES ?
            `;

            const values = assignments.map(assignment => [
                rosterId,
                assignment.employee_id,
                assignment.shift_id,
                assignment.duty_date
            ]);

            db.query(insertSql, [values], (err) => {

                if (err) {
                    return callback(err, null);
                }

                callback(null, {
                    message: "Roster generated successfully",
                    rosterId,
                    assignments
                });
            });
        });
    });
};

module.exports = {
    getRosterData,
    generateAssignments
};

