const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const { getProfile } = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", authMiddleware, getProfile);

// Ruta de ejemplo para comprobar la autorización administrativa.
router.get(
  "/admin-check",
  authMiddleware,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Acceso autorizado para administradores",
    });
  },
);

module.exports = router;
