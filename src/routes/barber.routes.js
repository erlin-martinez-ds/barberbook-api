const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  createBarberProfile,
  getBarbers,
  getBarberById,
  createBarberAccount,
} = require("../controllers/barber.controller");

const router = express.Router();

router.get("/", getBarbers);
router.get("/:id", getBarberById);

router.post("/", authMiddleware, authorizeRoles("BARBER"), createBarberProfile);
router.post(
  "/admin",
  authMiddleware,
  authorizeRoles("ADMIN"),
  createBarberAccount,
);
module.exports = router;
