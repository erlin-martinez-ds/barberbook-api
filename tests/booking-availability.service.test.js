const Booking = require("../src/models/booking.model");
const {
  checkBookingAvailability,
} = require("../src/services/booking-availability.service");

jest.mock("../src/models/booking.model");

describe("Booking availability service", () => {
  const reservation = {
    barberId: "barber-123",
    date: "2026-11-10",
    startTime: "10:00",
    endTime: "10:30",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("debe indicar disponibilidad cuando no hay cruces", async () => {
    Booking.findOne.mockResolvedValue(null);

    const result = await checkBookingAvailability(reservation);

    expect(result.available).toBe(true);
    expect(result.conflictingBooking).toBeNull();

    expect(Booking.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        barber: reservation.barberId,
        date: reservation.date,
        status: { $in: ["PENDING", "CONFIRMED"] },
        startTime: { $lt: reservation.endTime },
        endTime: { $gt: reservation.startTime },
      }),
    );
  });

  test("debe detectar un conflicto con otra reserva", async () => {
    const existingBooking = { _id: "booking-456" };
    Booking.findOne.mockResolvedValue(existingBooking);

    const result = await checkBookingAvailability(reservation);

    expect(result.available).toBe(false);
    expect(result.conflictingBooking).toBe(existingBooking);
  });

  test("debe excluir la propia reserva al volver a validar", async () => {
    Booking.findOne.mockResolvedValue(null);

    await checkBookingAvailability({
      ...reservation,
      excludeBookingId: "booking-789",
    });

    expect(Booking.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: { $ne: "booking-789" },
      }),
    );
  });
});
