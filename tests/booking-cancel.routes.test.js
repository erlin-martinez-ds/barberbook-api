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

const clientId = new mongoose.Types.ObjectId().toString();
const otherClientId = new mongoose.Types.ObjectId().toString();
const bookingId = new mongoose.Types.ObjectId().toString();

const createToken = (role = "USER", userId = clientId) =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const mockUserRole = (role = "USER", userId = clientId) => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: userId,
      role,
    }),
  });
};

const createBooking = (status = "PENDING", ownerId = clientId) => ({
  _id: bookingId,
  client: new mongoose.Types.ObjectId(ownerId),
  barber: new mongoose.Types.ObjectId().toString(),
  status,
});

describe("PATCH /api/bookings/:id/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole();
  });

  it("debe responder 401 si no se envía token", async () => {
    const response = await request(app).patch(
      `/api/bookings/${bookingId}/cancel`,
    );

    expect(response.status).toBe(401);
  });

  it("debe responder 403 si el usuario no tiene el rol USER", async () => {
    mockUserRole("BARBER");

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken("BARBER")}`);

    expect(response.status).toBe(403);
  });

  it("debe responder 400 si el identificador es inválido", async () => {
    const response = await request(app)
      .patch("/api/bookings/id-invalido/cancel")
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(400);
  });

  it("debe cancelar una reserva PENDING del cliente", async () => {
    const booking = createBooking("CANCELLED");

    Booking.findOneAndUpdate.mockResolvedValue(booking);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.booking.status).toBe("CANCELLED");
    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: bookingId,
        client: clientId,
        status: { $in: ["PENDING", "CONFIRMED"] },
      }),
      { $set: { status: "CANCELLED" } },
      { new: true, runValidators: true },
    );
  });

  it("debe cancelar una reserva CONFIRMED del cliente", async () => {
    const booking = createBooking("CANCELLED");

    Booking.findOneAndUpdate.mockResolvedValue(booking);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.booking.status).toBe("CANCELLED");
  });

  it("debe responder 404 si la reserva no existe", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);
    Booking.findById.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(404);
  });

  it("no debe permitir cancelar una reserva de otro cliente", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);
    Booking.findById.mockResolvedValue(createBooking("PENDING", otherClientId));

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(403);
  });

  it("debe responder 409 si la reserva ya está cancelada", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);
    Booking.findById.mockResolvedValue(createBooking("CANCELLED"));

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(409);
  });

  it("debe responder 409 si la reserva está rechazada", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);
    Booking.findById.mockResolvedValue(createBooking("REJECTED"));

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(409);
  });

  it("debe responder 409 si la reserva está completada", async () => {
    Booking.findOneAndUpdate.mockResolvedValue(null);
    Booking.findById.mockResolvedValue(createBooking("COMPLETED"));

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(409);
  });
});
