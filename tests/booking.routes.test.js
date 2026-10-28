const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Booking = require("../src/models/booking.model");
const Barber = require("../src/models/barber.model");
const Service = require("../src/models/service.model");
const User = require("../src/models/user.model");
const app = require("../src/app");

jest.mock("../src/models/booking.model");
jest.mock("../src/models/barber.model");
jest.mock("../src/models/service.model");
jest.mock("../src/models/user.model");

const JWT_SECRET = "clave-de-prueba-segura-para-jwt";
const clientId = new mongoose.Types.ObjectId().toString();
const barberId = new mongoose.Types.ObjectId().toString();
const serviceId = new mongoose.Types.ObjectId().toString();

const createToken = (role = "USER", userId = clientId) =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const mockUserRole = (role = "USER") => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: clientId,
      role,
    }),
  });
};

describe("POST /api/bookings", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rechaza una solicitud sin token", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({ barberId, serviceId, date: "2026-11-02", startTime: "10:00" });

    expect(response.status).toBe(401);
    expect(Booking).not.toHaveBeenCalled();
  });

  test("rechaza un rol que no sea USER", async () => {
    const token = createToken("BARBER");
    mockUserRole("BARBER");

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ barberId, serviceId, date: "2026-11-02", startTime: "10:00" });

    expect(response.status).toBe(403);
  });

  test("rechaza los campos obligatorios ausentes", async () => {
    const token = createToken();
    mockUserRole("USER");

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ barberId });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rechaza identificadores inválidos", async () => {
    const token = createToken();
    mockUserRole("USER");

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barberId: "no-es-id",
        serviceId,
        date: "2026-11-02",
        startTime: "10:00",
      });

    expect(response.status).toBe(400);
  });

  test("rechaza un barbero inexistente", async () => {
    const token = createToken();
    mockUserRole("USER");

    Barber.findById.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ barberId, serviceId, date: "2026-11-02", startTime: "10:00" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Barbero no encontrado");
  });

  test("rechaza un servicio inexistente", async () => {
    const token = createToken();
    mockUserRole("USER");

    Barber.findById.mockResolvedValue({ _id: barberId });
    Service.findById.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ barberId, serviceId, date: "2026-11-02", startTime: "10:00" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Servicio no encontrado");
  });

  test("rechaza un servicio inactivo", async () => {
    const token = createToken();
    mockUserRole("USER");

    Barber.findById.mockResolvedValue({ _id: barberId });
    Service.findById.mockResolvedValue({
      _id: serviceId,
      isActive: false,
      duration: 30,
    });

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ barberId, serviceId, date: "2026-11-02", startTime: "10:00" });

    expect(response.status).toBe(400);
  });

  test("crea una reserva pendiente con el cliente autenticado", async () => {
    const token = createToken();
    mockUserRole("USER");

    Barber.findById.mockResolvedValue({ _id: barberId });
    Service.findById.mockResolvedValue({
      _id: serviceId,
      isActive: true,
      duration: 30,
    });

    Booking.mockImplementation(function (data) {
      Object.assign(this, data);

      this.save = jest.fn().mockResolvedValue(undefined);

      this.toJSON = jest.fn(() => ({
        ...data,
        client: String(data.client),
        barber: String(data.barber),
        service: String(data.service),
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
      }));
    });

    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ barberId, serviceId, date: "2026-11-02", startTime: "10:00" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.booking.status).toBe("PENDING");
    expect(response.body.booking.client).toBe(clientId);
    expect(response.body.booking.endTime).toBe("10:30");
    expect(Booking).toHaveBeenCalledWith(
      expect.objectContaining({
        client: clientId,
        barber: barberId,
        service: serviceId,
        status: "PENDING",
      }),
    );
  });
});
