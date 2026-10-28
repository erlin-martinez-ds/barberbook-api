const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Barber = require("../models/barber.model");
const Service = require("../models/service.model");

const createBookingRequest = async (req, res) => {
  const body = req.body ?? {};

  if (typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Los datos de la reserva no tienen un formato válido",
    });
  }

  const allowedFields = ["barber", "service", "startTime"];
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    return res.status(400).json({
      success: false,
      message: "La solicitud contiene campos no permitidos",
    });
  }

  const { barber: barberId, service: serviceId, startTime: startValue } = body;
  const startTime = new Date(startValue);

  if (
    !mongoose.Types.ObjectId.isValid(barberId) ||
    !mongoose.Types.ObjectId.isValid(serviceId) ||
    typeof startValue !== "string" ||
    !Number.isFinite(startTime.getTime())
  ) {
    return res.status(400).json({
      success: false,
      message: "El barbero, el servicio o la fecha de inicio no son válidos",
    });
  }

  const [barber, service] = await Promise.all([
    Barber.findById(barberId),
    Service.findById(serviceId),
  ]);

  if (!barber || !barber.isActive || !service || !service.isActive) {
    return res.status(404).json({
      success: false,
      message: "El barbero o el servicio no existe o no está disponible",
    });
  }

  const endTime = new Date(
    startTime.getTime() + service.durationMinutes * 60 * 1000,
  );
  const conflictingBooking = await Booking.findOne({
    barber: barberId,
    status: { $in: ["PENDING", "CONFIRMED"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflictingBooking) {
    return res.status(409).json({
      success: false,
      message: "El barbero ya tiene una reserva en ese horario",
    });
  }

  const booking = await Booking.create({
    customer: req.user.id,
    barber: barberId,
    service: serviceId,
    startTime,
    endTime,
  });

  return res.status(201).json({
    success: true,
    booking,
  });
};

module.exports = { createBookingRequest };
