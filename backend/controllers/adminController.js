const db = require("../config/db");

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

module.exports = {
    createOrganization
};