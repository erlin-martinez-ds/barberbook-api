const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Barber = require("../models/barber.model");
const Service = require("../models/service.model");
const {
  checkBookingAvailability,
} = require("../services/booking-availability.service");

const createBooking = async (req, res, next) => {
  try {
    const { barberId, serviceId, date, startTime } = req.body;

    // Validar campos obligatorios.
    if (!barberId || !serviceId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message:
          "Los campos barberId, serviceId, date y startTime son obligatorios",
      });
    }

    // Validar identificadores de MongoDB.
    if (
      !mongoose.isValidObjectId(barberId) ||
      !mongoose.isValidObjectId(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "El identificador del barbero o del servicio no es válido",
      });
    }

    // Validar formato de fecha YYYY-MM-DD.
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "La fecha debe tener el formato YYYY-MM-DD",
      });
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "La fecha indicada no es válida",
      });
    }

    // Validar formato de hora de 24 horas.
    if (
      typeof startTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "La hora debe tener el formato HH:mm",
      });
    }

    // Comprobar que existen el barbero y el servicio.
    const [barber, service] = await Promise.all([
      Barber.findById(barberId),
      Service.findById(serviceId),
    ]);

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: "Barbero no encontrado",
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    if (service.isActive !== true) {
      return res.status(400).json({
        success: false,
        message: "No se puede reservar un servicio inactivo",
      });
    }

    // Calcular la hora final según la duración del servicio.
    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration;

    if (
      !Number.isInteger(service.duration) ||
      service.duration <= 0 ||
      endMinutes > 24 * 60
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El horario solicitado no es válido para la duración del servicio",
      });
    }

    const endTime = [
      String(Math.floor(endMinutes / 60)).padStart(2, "0"),
      String(endMinutes % 60).padStart(2, "0"),
    ].join(":");

    // El cliente siempre se obtiene del token autenticado.
    const booking = new Booking({
      client: req.user.id,
      barber: barberId,
      service: serviceId,
      date,
      startTime,
      endTime,
      status: "PENDING",
    });
    const { available } = await checkBookingAvailability({
      barberId,
      date,
      startTime,
      endTime,
    });

    if (!available) {
      return res.status(409).json({
        success: false,
        message: "El barbero ya tiene una reserva en ese horario",
      });
    }
    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Solicitud de reserva creada correctamente",
      booking,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Los datos de la reserva no son válidos",
        errors: Object.values(error.errors || {}).map((item) => item.message),
      });
    }

    return next(error);
  }
};

const listMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      client: req.user.id,
    }).sort({
      date: 1,
      startTime: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Reservas del cliente consultadas correctamente",
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  listMyBookings,
};
