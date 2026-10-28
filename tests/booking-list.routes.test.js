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
const otherClientId = new mongoose.Types.ObjectId().toString();

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

describe("GET /api/bookings - reservas del cliente", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("debe rechazar la consulta sin token", async () => {
    const response = await request(app).get("/api/bookings");

    expect(response.status).toBe(401);
  });

  test("debe rechazar usuarios con roles no autorizados", async () => {
    mockUserRole("BARBER", clientId);

    const response = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${createToken("BARBER")}`);

    expect(response.status).toBe(403);
    expect(Booking.find).not.toHaveBeenCalled();
  });

  test("debe devolver las reservas del cliente autenticado", async () => {
    const bookings = [
      {
        _id: "booking-1",
        client: clientId,
        status: "PENDING",
        date: "2026-11-10",
        startTime: "10:00",
        endTime: "10:30",
      },
      {
        _id: "booking-2",
        client: clientId,
        status: "CONFIRMED",
        date: "2026-11-12",
        startTime: "11:00",
        endTime: "11:30",
      },
    ];

    mockUserRole("USER");

    Booking.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(bookings),
    });

    const response = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(2);
    expect(response.body.bookings).toHaveLength(2);

    expect(Booking.find).toHaveBeenCalledWith({
      client: clientId,
    });
  });

  test("debe devolver una lista vacÃ­a si el cliente no tiene reservas", async () => {
    mockUserRole("USER");

    Booking.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    const response = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.bookings).toEqual([]);
  });

  test("debe consultar Ãºnicamente por el ID del cliente autenticado", async () => {
    mockUserRole("USER");

    Booking.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(Booking.find).toHaveBeenCalledWith({
      client: clientId,
    });

    expect(Booking.find).not.toHaveBeenCalledWith({
      client: otherClientId,
    });
  });
});
