const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createOrganization,
    createDepartment,
    getDepartments,
    createEmployee
} = require("../controllers/adminController");

const router = express.Router();



router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware("ADMIN"),
    (req, res) => {
        res.json({
            message: "Welcome to Admin Dashboard",
            user: req.user
        });
    }
);

router.post(
    "/organizations",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createOrganization
);

router.post(
    "/departments",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createDepartment
);

router.get(
    "/departments",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getDepartments
);

router.post(
    "/employees",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createEmployee
);

module.exports = router;