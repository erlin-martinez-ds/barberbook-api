const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Se requiere un token de autenticación",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticación inválido",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(new Error("La variable JWT_SECRET no está definida"));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación inválido",
      });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};

module.exports = authMiddleware;
