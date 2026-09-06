const express = require("express");
const {login, signup, verifyManager} = require("../controllers/authController");

const router = express.Router();

router.post("/login",login);
router.post("/signup",signup);
router.post("/verify-manager", verifyManager);

module.exports = router;