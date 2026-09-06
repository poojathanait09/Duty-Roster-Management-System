const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");


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

const getEmployees = (req, res) => {

    const sql = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.department_id,
            d.name AS department_name
        FROM users u
        LEFT JOIN departments d
            ON u.department_id = d.id
        WHERE u.organization_id = ?
        AND u.role = 'EMPLOYEE'
    `;

    // Get organization of logged-in Admin
    db.query(
        `SELECT organization_id FROM users WHERE id = ?`,
        [req.user.id],
        (err, adminResult) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (adminResult.length === 0) {
                return res.status(404).json({
                    message: "Admin not found"
                });
            }

            const organizationId = adminResult[0].organization_id;

            if (!organizationId) {
                return res.status(400).json({
                    message: "Admin is not assigned to an organization"
                });
            }

            db.query(
                sql,
                [organizationId],
                (err, employees) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to fetch employees",
                            error: err.message
                        });
                    }

                    res.json({
                        employees: employees
                    });
                }
            );
        }
    );
};

const updateEmployee = (req, res) => {
    const employeeId = req.params.id;
    const { name, email, department_id } = req.body;

    if (!name || !email || !department_id) {
        return res.status(400).json({
            message: "Name, email and department are required"
        });
    }

    // Get Admin's organization
    const getAdminSql = `
        SELECT organization_id
        FROM users
        WHERE id = ? AND role = 'ADMIN'
    `;

    db.query(getAdminSql, [req.user.id], (err, adminResult) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (adminResult.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const organizationId = adminResult[0].organization_id;

        // Check employee belongs to this organization
        const checkEmployeeSql = `
            SELECT id
            FROM users
            WHERE id = ?
            AND organization_id = ?
            AND role = 'EMPLOYEE'
        `;

        db.query(
            checkEmployeeSql,
            [employeeId, organizationId],
            (err, employeeResult) => {

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

                // Check department belongs to same organization
                const checkDepartmentSql = `
                    SELECT id
                    FROM departments
                    WHERE id = ?
                    AND organization_id = ?
                `;

                db.query(
                    checkDepartmentSql,
                    [department_id, organizationId],
                    (err, departmentResult) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error",
                                error: err.message
                            });
                        }

                        if (departmentResult.length === 0) {
                            return res.status(400).json({
                                message: "Invalid department"
                            });
                        }

                        const updateSql = `
                            UPDATE users
                            SET name = ?, email = ?, department_id = ?
                            WHERE id = ?
                        `;

                        db.query(
                            updateSql,
                            [name, email, department_id, employeeId],
                            (err) => {

                                if (err) {
                                    if (err.code === "ER_DUP_ENTRY") {
                                        return res.status(400).json({
                                            message: "Email already exists"
                                        });
                                    }

                                    return res.status(500).json({
                                        message: "Failed to update employee",
                                        error: err.message
                                    });
                                }

                                res.json({
                                    message: "Employee updated successfully"
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};

const deleteEmployee = (req, res) => {
    const employeeId = req.params.id;

    // Get Admin's organization
    const getAdminSql = `
        SELECT organization_id
        FROM users
        WHERE id = ? AND role = 'ADMIN'
    `;

    db.query(getAdminSql, [req.user.id], (err, adminResult) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (adminResult.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const organizationId = adminResult[0].organization_id;

        // Make sure employee belongs to this organization
        const checkEmployeeSql = `
            SELECT id
            FROM users
            WHERE id = ?
            AND organization_id = ?
            AND role = 'EMPLOYEE'
        `;

        db.query(
            checkEmployeeSql,
            [employeeId, organizationId],
            (err, employeeResult) => {

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

                const deleteSql = `
                    DELETE FROM users
                    WHERE id = ?
                `;

                db.query(deleteSql, [employeeId], (err) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to delete employee",
                            error: err.message
                        });
                    }

                    res.json({
                        message: "Employee deleted successfully"
                    });
                });
            }
        );
    });
};

const createManager = (req, res) => {
    const { name, email, password, department_id } = req.body;

    if (!name || !email || !password || !department_id) {
        return res.status(400).json({
            message: "Name, email, password and department are required"
        });
    }

    // Get Admin's organization
    const getAdminSql = `
        SELECT organization_id
        FROM users
        WHERE id = ? AND role = 'ADMIN'
    `;

    db.query(getAdminSql, [req.user.id], (err, adminResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (adminResult.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const organizationId = adminResult[0].organization_id;

        if (!organizationId) {
            return res.status(400).json({
                message: "Admin is not assigned to an organization"
            });
        }

        // Check department belongs to Admin's organization
        const checkDepartmentSql = `
            SELECT id
            FROM departments
            WHERE id = ?
            AND organization_id = ?
        `;

        db.query(
            checkDepartmentSql,
            [department_id, organizationId],
            (err, departmentResult) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                if (departmentResult.length === 0) {
                    return res.status(400).json({
                        message: "Invalid department"
                    });
                }

                // Generate manager verification code
                const managerCode = crypto
                    .randomBytes(6)
                    .toString("hex")
                    .toUpperCase();

                // Hash password
                const hashedPassword = bcrypt.hashSync(password, 10);

                const insertUserSql = `
                    INSERT INTO users
                    (
                        organization_id,
                        department_id,
                        name,
                        email,
                        password,
                        role,
                        manager_code
                    )
                    VALUES (?, ?, ?, ?, ?, 'MANAGER', ?)
                `;

                db.query(
                    insertUserSql,
                    [
                        organizationId,
                        department_id,
                        name,
                        email,
                        hashedPassword,
                        managerCode
                    ],
                    (err, result) => {

                        if (err) {

                            if (err.code === "ER_DUP_ENTRY") {
                                return res.status(400).json({
                                    message: "Email already exists"
                                });
                            }

                            return res.status(500).json({
                                message: "Failed to create manager",
                                error: err.message
                            });
                        }

                        const managerId = result.insertId;

                        // Assign manager to department
                        const updateDepartmentSql = `
                            UPDATE departments
                            SET manager_id = ?
                            WHERE id = ?
                        `;

                        db.query(
                            updateDepartmentSql,
                            [managerId, department_id],
                            (err) => {

                                if (err) {
                                    return res.status(500).json({
                                        message: "Manager created but failed to assign department",
                                        error: err.message
                                    });
                                }

                                res.status(201).json({
                                    message: "Manager created successfully",
                                    managerId: managerId,
                                    managerCode: managerCode
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
    createOrganization,
    createDepartment,
    getDepartments,
    createEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee,
    createManager
};