const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = (req, res) => {
    const {email, password} = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
        if(err){
            return res.status(500).json({message:"Database error"});
        }

        if(results.length === 0) {
            return res.status(401).json({message: "Invalid email or password"});
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword){
            return res.status(401).json({message: "Invalid email or password"});
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                organisation_id: user.organisation_id
            },
            process.env.JWT_SECRET,
            {expiresIn: "1d"}

        );

        res.json({
            message: "login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });


};

const signup = (req,res) => {
    const {name, email, password, role} = req.body;

    const hashedPassword = bcrypt.hashSync(password,10);

    const sql =` INSERT INTO users (name, email, password,role) VALUES (?,?,?,?)`;

    db.query(
        sql,
        [name,email,hashedPassword, role],
        (err,result) => {
            if(err) {
                return res.status(500).json({
                    message:"Signup failed",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "User created successfully",
                userId: result.insertId
            });
        }
    );
};

const verifyManager = (req, res) => {
    const { email, manager_code, password } = req.body;

    if (!email || !manager_code || !password) {
        return res.status(400).json({
            message: "Email, manager code and password are required"
        });
    }

    const sql = `
        SELECT id, name, organization_id, department_id
        FROM users
        WHERE email = ?
        AND manager_code = ?
        AND role = 'MANAGER'
    `;

    db.query(
        sql,
        [email, manager_code],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or manager code"
                });
            }

            const manager = results[0];

            const hashedPassword = bcrypt.hashSync(password, 10);

            const updateSql = `
                UPDATE users
                SET password = ?
                WHERE id = ?
            `;

            db.query(
                updateSql,
                [hashedPassword, manager.id],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to verify manager",
                            error: err.message
                        });
                    }

                    res.json({
                        message: "Manager verified successfully",
                        managerId: manager.id,
                        departmentId: manager.department_id
                    });
                }
            );
        }
    );
};

module.exports = {login, signup, verifyManager};