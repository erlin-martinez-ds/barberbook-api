const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const {
  createProfile,
  listAvailable,
} = require("../controllers/barber.controller");

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("BARBER"), createProfile);
router.get("/", listAvailable);

module.exports = router;
