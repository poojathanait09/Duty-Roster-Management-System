const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    applyLeave,
    getMyLeaves,
    getDepartmentLeaves,
     approveLeave,
     rejectLeave
    

} = require("../controllers/leaveController");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("EMPLOYEE"),
    applyLeave
);


router.get(
    "/my",
    authMiddleware,
    roleMiddleware("EMPLOYEE"),
    getMyLeaves
);

router.get(
    "/manager",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getDepartmentLeaves
);

router.put(
    "/manager/:id/approve",
    authMiddleware,
    roleMiddleware("MANAGER"),
    approveLeave
);

router.put(
    "/manager/:id/reject",
    authMiddleware,
    roleMiddleware("MANAGER"),
    rejectLeave
);

module.exports = router;