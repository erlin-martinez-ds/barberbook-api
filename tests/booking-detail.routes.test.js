process.env.JWT_SECRET = "clave-de-prueba-segura-para-jwt";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Booking = require("../src/models/booking.model");
const User = require("../src/models/user.model");
const app = require("../src/app");

jest.mock("../src/models/booking.model");
jest.mock("../src/models/user.model");

const JWT_SECRET = "clave-de-prueba-segura-para-jwt";
const clientId = new mongoose.Types.ObjectId().toString();
const barberId = new mongoose.Types.ObjectId().toString();
const bookingId = new mongoose.Types.ObjectId().toString();

const createToken = (role = "USER", userId = clientId) =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const mockUserRole = (role, userId) => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: userId,
      role,
    }),
  });
};

describe("GET /api/bookings/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("debe rechazar una petición sin token", async () => {
    const response = await request(app).get(`/api/bookings/${bookingId}`);

    expect(response.status).toBe(401);
  });

  test("debe rechazar un identificador inválido", async () => {
    mockUserRole("USER", clientId);

    const response = await request(app)
      .get("/api/bookings/identificador-invalido")
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(response.status).toBe(400);
    expect(Booking.findOne).not.toHaveBeenCalled();
  });

  test("debe devolver una reserva del cliente autenticado", async () => {
    const booking = {
      _id: bookingId,
      client: clientId,
      barber: barberId,
      status: "PENDING",
    };

    mockUserRole("USER", clientId);
    Booking.findOne.mockResolvedValue(booking);

    const response = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.booking._id).toBe(bookingId);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: bookingId,
      client: clientId,
    });
  });

  test("debe devolver 404 si la reserva no pertenece al cliente", async () => {
    mockUserRole("USER", clientId);
    Booking.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: bookingId,
      client: clientId,
    });
  });

  test("debe permitir al barbero consultar una reserva asignada", async () => {
    const booking = {
      _id: bookingId,
      client: clientId,
      barber: barberId,
      status: "CONFIRMED",
    };

    mockUserRole("BARBER", barberId);
    Booking.findOne.mockResolvedValue(booking);

    const response = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${createToken("BARBER", barberId)}`);

    expect(response.status).toBe(200);
    expect(response.body.booking._id).toBe(bookingId);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: bookingId,
      barber: barberId,
    });
  });

  test("debe devolver 404 si la reserva no está asignada al barbero", async () => {
    mockUserRole("BARBER", barberId);
    Booking.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${createToken("BARBER", barberId)}`);

    expect(response.status).toBe(404);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: bookingId,
      barber: barberId,
    });
  });
});
