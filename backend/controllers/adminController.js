const db = require("../config/db");
const bcrypt = require("bcryptjs");

const createOrganization = (req, res) => {
    const { name, industry, working_days } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Organization name is required"
        });
    }

    const sql = `
        INSERT INTO organizations (name, industry, working_days)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [name, industry || null, working_days || 7],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to create organization",
                    error: err.message
                });
            }

            const organizationId = result.insertId;

            const updateUserSql = `
                UPDATE users
                SET organization_id = ?
                WHERE id = ?
            `;

            db.query(
                updateUserSql,
                [organizationId, req.user.id],
                (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({
                            message: "Organization created but failed to assign it to Admin",
                            error: updateErr.message
                        });
                    }

                    res.status(201).json({
                        message: "Organization created successfully",
                        organizationId: organizationId
                    });
                }
            );
        }
    );
};

const createDepartment = (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Department name is required"
        });
    }

    // Get the organization of the logged-in admin
    const getUserSql = `
        SELECT organization_id
        FROM users
        WHERE id = ?
    `;

    db.query(getUserSql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const organizationId = results[0].organization_id;

        if (!organizationId) {
            return res.status(400).json({
                message: "Admin is not assigned to an organization"
            });
        }

        const sql = `
            INSERT INTO departments (organization_id, name)
            VALUES (?, ?)
        `;

        db.query(
            sql,
            [organizationId, name],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Failed to create department",
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Department created successfully",
                    departmentId: result.insertId
                });
            }
        );
    });
};


const getDepartments = (req, res) => {

    const sql = `
        SELECT d.id, d.name, d.manager_id
        FROM departments d
        JOIN users u
            ON u.organization_id = d.organization_id
        WHERE u.id = ?
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch departments",
                error: err.message
            });
        }

        res.json({
            departments: results
        });
    });
};

const createEmployee = (req, res) => {
    const { name, email, password, department_id } = req.body;

    if (!name || !email || !password || !department_id) {
        return res.status(400).json({
            message: "Name, email, password and department are required"
        });
    }

    // Get the Admin's organization
    const getAdminSql = `
        SELECT organization_id
        FROM users
        WHERE id = ?
    `;

    db.query(getAdminSql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const organizationId = results[0].organization_id;

        if (!organizationId) {
            return res.status(400).json({
                message: "Admin is not assigned to an organization"
            });
        }

        // Check that department belongs to the Admin's organization
        const checkDepartmentSql = `
            SELECT id
            FROM departments
            WHERE id = ? AND organization_id = ?
        `;

        db.query(
            checkDepartmentSql,
            [department_id, organizationId],
            (err, departments) => {
                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                if (departments.length === 0) {
                    return res.status(400).json({
                        message: "Invalid department"
                    });
                }

                // Hash employee password
                const hashedPassword = bcrypt.hashSync(password, 10);

                const sql = `
                    INSERT INTO users
                    (organization_id, department_id, name, email, password, role)
                    VALUES (?, ?, ?, ?, ?, 'EMPLOYEE')
                `;

                db.query(
                    sql,
                    [
                        organizationId,
                        department_id,
                        name,
                        email,
                        hashedPassword
                    ],
                    (err, result) => {
                        if (err) {
                            if (err.code === "ER_DUP_ENTRY") {
                                return res.status(400).json({
                                    message: "Email already exists"
                                });
                            }

                            return res.status(500).json({
                                message: "Failed to create employee",
                                error: err.message
                            });
                        }

                        res.status(201).json({
                            message: "Employee created successfully",
                            employeeId: result.insertId
                        });
                    }
                );
            }
        );
    });
};

module.exports = {
    createOrganization,
    createDepartment,
    getDepartments,
    createEmployee
};