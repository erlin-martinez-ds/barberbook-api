const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const { createBooking } = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("USER"), createBooking);

module.exports = router;
