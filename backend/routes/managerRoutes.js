const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getDepartmentEmployees, createShift,
    getShifts, updateShift, deleteShift
} = require("../controllers/managerController");


const router = express.Router();

router.get(
    "/employees",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getDepartmentEmployees
);

router.post(
    "/shifts",
    authMiddleware,
    roleMiddleware("MANAGER"),
    createShift
);

router.get(
    "/shifts",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getShifts
);

router.put(
    "/shifts/:id",
    authMiddleware,
    roleMiddleware("MANAGER"),
    updateShift
);

router.delete(
    "/shifts/:id",
    authMiddleware,
    roleMiddleware("MANAGER"),
    deleteShift
);

module.exports = router;