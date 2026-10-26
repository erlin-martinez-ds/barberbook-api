
const express = require("express");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "BarberBook API funcionando correctamente",
  });
});

// El middleware de errores debe ir después de todas las rutas.
app.use(errorMiddleware);

module.exports = app;
