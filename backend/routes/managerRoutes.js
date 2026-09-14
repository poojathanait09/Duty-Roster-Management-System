const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getDepartmentEmployees, createShift,
    getShifts, updateShift, deleteShift,setShiftRequirement,
    getShiftRequirements
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

router.put(
    "/shifts/:id/requirement",
    authMiddleware,
    roleMiddleware("MANAGER"),
    setShiftRequirement
);

router.get(
    "/shift-requirements",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getShiftRequirements
);

module.exports = router;