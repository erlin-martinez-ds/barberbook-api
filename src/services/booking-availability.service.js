const Booking = require("../models/booking.model");

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED"];

/**
 * Comprueba si un barbero ya tiene una reserva que se cruce
 * con el intervalo solicitado.
 *
 * Los horarios deben tener formato HH:mm.
 */
const checkBookingAvailability = async ({
  barberId,
  date,
  startTime,
  endTime,
  excludeBookingId,
}) => {
  const query = {
    barber: barberId,
    date,
    status: { $in: BLOCKING_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  // Permite volver a validar una reserva existente sin compararla
  // contra sí misma al confirmar una solicitud.
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);

  return {
    available: !conflictingBooking,
    conflictingBooking,
  };
};

module.exports = {
  checkBookingAvailability,
};
