const mongoose = require("mongoose");
const Booking = require("../src/models/booking.model");

describe("Modelo de reservas", () => {
  const validBooking = {
    customer: new mongoose.Types.ObjectId(),
    barber: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    startTime: new Date("2026-10-28T10:00:00.000Z"),
    endTime: new Date("2026-10-28T11:00:00.000Z"),
  };

  test("usa PENDING como estado predeterminado y habilita timestamps", () => {
    const booking = new Booking(validBooking);

    expect(booking.status).toBe("PENDING");
    expect(Booking.schema.options.timestamps).toBe(true);
  });

  test("requiere cliente, barbero, servicio e intervalo de tiempo válido", async () => {
    const booking = new Booking(validBooking);

    await expect(booking.validate()).resolves.toBeUndefined();
  });

  test("rechaza un estado no definido", async () => {
    const booking = new Booking({ ...validBooking, status: "UNKNOWN" });

    await expect(booking.validate()).rejects.toMatchObject({
      errors: { status: expect.any(mongoose.Error.ValidatorError) },
    });
  });

  test("rechaza una hora de finalización anterior o igual al inicio", async () => {
    const booking = new Booking({
      ...validBooking,
      endTime: validBooking.startTime,
    });

    await expect(booking.validate()).rejects.toMatchObject({
      errors: { endTime: expect.any(mongoose.Error.ValidatorError) },
    });
  });
});
