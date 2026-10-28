
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  createBooking,
  listMyBookings,
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("USER"), createBooking);

// Consultar las reservas del cliente autenticado
router.get(
  "/my-bookings",
  authMiddleware,
  authorizeRoles("USER"),
  listMyBookings
);

// Mantener la ruta existente
router.get("/", authMiddleware, authorizeRoles("USER"), listMyBookings);

module.exports = router;
