const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getMyRoster
} = require("../controllers/employeeController");

const router = express.Router();

router.get(
    "/roster",
    authMiddleware,
    roleMiddleware("EMPLOYEE"),
    getMyRoster
);

module.exports = router;