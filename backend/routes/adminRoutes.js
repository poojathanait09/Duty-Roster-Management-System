const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createOrganization
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

module.exports = router;