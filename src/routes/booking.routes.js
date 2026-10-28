const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const { createBookingRequest } = require("../controllers/booking.controller");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles("USER"),
  createBookingRequest,
);

module.exports = router;
