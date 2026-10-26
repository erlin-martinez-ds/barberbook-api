const User = require("../models/user.model");

const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Se requiere autenticación",
      });
    }

    try {
      const user = await User.findById(req.user.id).select("role");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "El usuario ya no existe o no está autorizado",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para realizar esta acción",
        });
      }

      // Usar el rol actual de la base de datos.
      req.user.role = user.role;

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = authorizeRoles;
