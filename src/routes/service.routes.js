const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  createService,
  getServices,
  getServiceById,
  updateServiceAvailability,
} = require("../controllers/service.controller");

const router = express.Router();

router.get("/", getServices);
router.get("/:id", getServiceById);

router.post("/", authMiddleware, authorizeRoles("ADMIN"), createService);

router.patch(
  "/:id/availability",
  authMiddleware,
  authorizeRoles("ADMIN"),
  updateServiceAvailability,
);

module.exports = router;
