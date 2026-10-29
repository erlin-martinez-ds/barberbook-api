const express = require("express");
const errorMiddleware = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const barberRoutes = require("./routes/barber.routes");
const serviceRoutes = require("./routes/service.routes");
const bookingRoutes = require("./routes/booking.routes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/barbers", barberRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);

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
