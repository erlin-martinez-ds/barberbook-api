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

const createPendingBooking = () => ({
  _id: bookingId,
  client: clientId,
  barber: barberId,
  service: new mongoose.Types.ObjectId(),
  date: "2026-11-10",
  startTime: "10:00",
  endTime: "10:30",
  status: "PENDING",
});

describe("PATCH /api/bookings/:id/confirm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("debe rechazar la petición sin token", async () => {
    const response = await request(app).patch(
      `/api/bookings/${bookingId}/confirm`,
    );

    expect(response.status).toBe(401);
  });

  test("debe rechazar a un usuario que no sea barbero", async () => {
    mockUserRole("USER", clientId);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set("Authorization", `Bearer ${createToken("USER", clientId)}`);

    expect(response.status).toBe(403);
    expect(Booking.findOne).not.toHaveBeenCalled();
  });

  test("debe rechazar un identificador inválido", async () => {
    mockUserRole();

    const response = await request(app)
      .patch("/api/bookings/identificador-invalido/confirm")
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(400);
    expect(Booking.findOne).not.toHaveBeenCalled();
  });

  test("debe devolver 404 si la reserva no está asignada al barbero", async () => {
    mockUserRole();
    Booking.findOne.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(404);
  });

  test("debe rechazar una reserva que no está pendiente", async () => {
    mockUserRole();

    Booking.findOne.mockResolvedValue({
      ...createPendingBooking(),
      status: "CONFIRMED",
    });

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(409);
    expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("debe rechazar la confirmación si existe un conflicto de horario", async () => {
    mockUserRole();
    Booking.findOne.mockResolvedValue(createPendingBooking());
    Booking.findOneAndUpdate.mockClear();

    Booking.findOne
      .mockImplementationOnce(async () => createPendingBooking())
      .mockImplementationOnce(async () => ({
        _id: new mongoose.Types.ObjectId(),
      }));

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(409);
    expect(Booking.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("debe confirmar la reserva cuando está pendiente y disponible", async () => {
    mockUserRole();

    const pendingBooking = createPendingBooking();
    const confirmedBooking = {
      ...pendingBooking,
      status: "CONFIRMED",
    };

    Booking.findOne
      .mockResolvedValueOnce(pendingBooking)
      .mockResolvedValueOnce(null);

    Booking.findOneAndUpdate.mockResolvedValue(confirmedBooking);

    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.booking.status).toBe("CONFIRMED");

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: bookingId,
        barber: barberId,
        status: "PENDING",
      },
      {
        $set: { status: "CONFIRMED" },
      },
      {
        new: true,
        runValidators: true,
      },
    );
  });
});
