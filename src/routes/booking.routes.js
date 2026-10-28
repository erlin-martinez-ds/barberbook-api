const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  createBooking,
  listMyBookings,
  getBookingById,
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("USER"), createBooking);
router.get("/", authMiddleware, authorizeRoles("USER"), listMyBookings);
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("USER", "BARBER"),
  getBookingById,
);
module.exports = router;
