process.env.JWT_SECRET = "clave-de-prueba-segura-para-jwt";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

jest.mock("../src/models/booking.model");
jest.mock("../src/models/user.model");

const Booking = require("../src/models/booking.model");
const User = require("../src/models/user.model");
const app = require("../src/app");

const JWT_SECRET = "clave-de-prueba-segura-para-jwt";

const barberId = new mongoose.Types.ObjectId().toString();
const clientId = new mongoose.Types.ObjectId().toString();
const bookingId = new mongoose.Types.ObjectId().toString();

const createToken = (role = "BARBER", userId = barberId) =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const mockUserRole = (role = "BARBER", userId = barberId) => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: userId,
      role,
    }),
  });
};

describe("PATCH /api/bookings/:id/reject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("debe rechazar la petición sin token", async () => {
    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/reject`)
      .send({ reason: "El barbero no tiene disponibilidad" });

    expect(response.status).toBe(401);
  });

  test("debe rechazar a un usuario que no sea barbero", async () => {
    mockUserRole("USER", clientId);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/reject`)
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`)
      .send({ reason: "El barbero no tiene disponibilidad" });

    expect(response.status).toBe(403);
    expect(Booking.findOne).not.toHaveBeenCalled();
  });

  test("debe rechazar un identificador inválido", async () => {
    mockUserRole();

    const response = await request(app)
      .patch("/api/bookings/identificador-invalido/reject")
      .set("Authorization", `Bearer ${createToken()}`)
      .send({ reason: "El barbero no tiene disponibilidad" });

    expect(response.status).toBe(400);
    expect(Booking.findOne).not.toHaveBeenCalled();
  });

  test("debe exigir un motivo de rechazo", async () => {
    mockUserRole();

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/reject`)
      .set("Authorization", `Bearer ${createToken()}`)
      .send({ reason: "   " });

    expect(response.status).toBe(400);
    expect(Booking.findOne).not.toHaveBeenCalled();
  });

  test("debe devolver 404 si la reserva no pertenece al barbero", async () => {
    mockUserRole();
    Booking.findOne.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/reject`)
      .set("Authorization", `Bearer ${createToken()}`)
      .send({ reason: "El barbero no tiene disponibilidad" });

    expect(response.status).toBe(404);
  });

  test("debe rechazar una reserva que no está pendiente", async () => {
    mockUserRole();

    Booking.findOne.mockResolvedValue({
      _id: bookingId,
      barber: barberId,
      status: "CONFIRMED",
    });

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/reject`)
      .set("Authorization", `Bearer ${createToken()}`)
      .send({ reason: "El barbero no tiene disponibilidad" });

    expect(response.status).toBe(409);
    expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("debe rechazar la reserva y guardar el motivo", async () => {
    mockUserRole();

    Booking.findOne.mockResolvedValue({
      _id: bookingId,
      barber: barberId,
      status: "PENDING",
    });

    Booking.findOneAndUpdate.mockResolvedValue({
      _id: bookingId,
      barber: barberId,
      status: "REJECTED",
      rejectionReason: "El barbero no tiene disponibilidad",
    });

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/reject`)
      .set("Authorization", `Bearer ${createToken()}`)
      .send({ reason: "  El barbero no tiene disponibilidad  " });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.booking.status).toBe("REJECTED");
    expect(response.body.booking.rejectionReason).toBe(
      "El barbero no tiene disponibilidad",
    );

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: bookingId,
        barber: barberId,
        status: "PENDING",
      },
      {
        $set: {
          status: "REJECTED",
          rejectionReason: "El barbero no tiene disponibilidad",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
  });
});
