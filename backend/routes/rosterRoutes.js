const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createRoster, getRosters, generateRoster,  getRosterAssignments,
    updateRosterAssignment, publishRoster
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

router.put(
    "/:rosterId/assignments/:assignmentId",
    authMiddleware,
    roleMiddleware("MANAGER"),
    updateRosterAssignment
);

router.put(
    "/:id/publish",
    authMiddleware,
    roleMiddleware("MANAGER"),
    publishRoster
);

module.exports = router;