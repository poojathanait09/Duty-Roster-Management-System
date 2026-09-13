const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createRoster, getRosters, generateRoster,  getRosterAssignments
} = require("../controllers/rosterController");



const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("MANAGER"),
    createRoster
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getRosters
);

router.post(
    "/:id/generate",
    authMiddleware,
    roleMiddleware("MANAGER"),
    generateRoster
);

router.get(
    "/:id/assignments",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getRosterAssignments
);

module.exports = router;