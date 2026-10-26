const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  const isProduction = process.env.NODE_ENV === "production";

  const message =
    statusCode >= 500 && isProduction
      ? "Error interno del servidor"
      : err.message || "Error interno del servidor";

  const response = {
    success: false,
    message,
  };

  // Los detalles técnicos solo se exponen fuera de producción.
  if (!isProduction) {
    response.details = {
      name: err.name,
      stack: err.stack,
    };
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
