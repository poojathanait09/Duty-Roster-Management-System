const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createRoster
} = require("../controllers/rosterController");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("MANAGER"),
    createRoster
);

module.exports = router;