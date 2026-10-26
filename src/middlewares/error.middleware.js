
const errorMiddleware = (err, req, res, next) => {
  const requestedStatus = Number(err.statusCode || err.status);

  const statusCode =
    Number.isInteger(requestedStatus) &&
    requestedStatus >= 400 &&
    requestedStatus <= 599
      ? requestedStatus
      : 500;

  const isProduction = process.env.NODE_ENV === "production";

  const message =
    statusCode >= 500 && isProduction
      ? "Error interno del servidor"
      : err.message || "Error interno del servidor";

  const response = {
    success: false,
    message,
  };

  if (!isProduction) {
    response.details = {
      name: err.name || "Error",
      stack: err.stack,
    };
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
