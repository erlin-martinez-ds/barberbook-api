const express = require("express");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "BarberBook API funcionando correctamente",
  });
});

// Ruta temporal para probar el middleware de errores.
if (process.env.NODE_ENV !== "production") {
  app.get("/test-error", (req, res, next) => {
    const error = new Error("Error de prueba del middleware");
    error.statusCode = 500;

    next(error);
  });
}

// Debe ir después de todas las rutas.
app.use(errorMiddleware);

module.exports = app;
