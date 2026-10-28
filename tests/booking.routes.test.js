jest.mock("../src/models/user.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/barber.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/service.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/booking.model", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user.model");
const Barber = require("../src/models/barber.model");
const Service = require("../src/models/service.model");
const Booking = require("../src/models/booking.model");
const app = require("../src/app");

describe("Solicitudes de reserva", () => {
  const authSecret = "clave-de-prueba-segura-para-jwt";
  const customerId = "650000000000000000000001";
  const barberId = "650000000000000000000002";
  const serviceId = "650000000000000000000003";
  const startTime = "2026-10-28T10:00:00.000Z";
  let existingBookings;
  const token = jwt.sign({ role: "USER" }, authSecret, {
    subject: customerId,
    expiresIn: "1h",
  });

  const submitBooking = (body) =>
    request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = authSecret;
    existingBookings = [];
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: "USER" }),
    });
    Barber.findById.mockResolvedValue({ isActive: true });
    Service.findById.mockResolvedValue({ durationMinutes: 45, isActive: true });
    Booking.findOne.mockImplementation(async (filter) =>
      existingBookings.find(
        (booking) =>
          booking.barber === filter.barber &&
          filter.status.$in.includes(booking.status) &&
          new Date(booking.startTime) < filter.startTime.$lt &&
          new Date(booking.endTime) > filter.endTime.$gt,
      ) ?? null,
    );
    Booking.create.mockImplementation(async (booking) => ({
      _id: "reserva123",
      ...booking,
      status: "PENDING",
    }));
  });

  test("calcula el fin usando la duración del servicio y crea la reserva pendiente", async () => {
    const response = await submitBooking({
      barber: barberId,
      service: serviceId,
      startTime,
    });

    expect(response.status).toBe(201);
    expect(Booking.create).toHaveBeenCalledWith({
      customer: customerId,
      barber: barberId,
      service: serviceId,
      startTime: new Date(startTime),
      endTime: new Date("2026-10-28T10:45:00.000Z"),
    });
    expect(response.body.booking.status).toBe("PENDING");
  });

  test.each(["PENDING", "CONFIRMED"])(
    "devuelve conflicto si existe una reserva %s que se solapa",
    async (status) => {
      existingBookings.push({
        _id: "reserva-existente",
        barber: barberId,
        status,
        startTime: "2026-10-28T10:30:00.000Z",
        endTime: "2026-10-28T11:30:00.000Z",
      });

      const response = await submitBooking({
        barber: barberId,
        service: serviceId,
        startTime,
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(Booking.findOne).toHaveBeenCalledWith({
        barber: barberId,
        status: { $in: ["PENDING", "CONFIRMED"] },
        startTime: { $lt: new Date("2026-10-28T10:45:00.000Z") },
        endTime: { $gt: new Date(startTime) },
      });
      expect(Booking.create).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["antes", "2026-10-28T09:00:00.000Z", startTime],
    ["después", "2026-10-28T10:45:00.000Z", "2026-10-28T11:30:00.000Z"],
  ])(
    "acepta un horario adyacente por el límite %s",
    async (_side, existingStart, existingEnd) => {
      existingBookings.push({
        barber: barberId,
        status: "CONFIRMED",
        startTime: existingStart,
        endTime: existingEnd,
      });

      const response = await submitBooking({
        barber: barberId,
        service: serviceId,
        startTime,
      });

      expect(response.status).toBe(201);
      expect(Booking.create).toHaveBeenCalledTimes(1);
    },
  );

  test.each(["CANCELLED", "COMPLETED"])(
    "ignora reservas %s al comprobar disponibilidad",
    async (status) => {
      existingBookings.push({
        barber: barberId,
        status,
        startTime: "2026-10-28T10:30:00.000Z",
        endTime: "2026-10-28T11:30:00.000Z",
      });

      const response = await submitBooking({
        barber: barberId,
        service: serviceId,
        startTime,
      });

      expect(response.status).toBe(201);
    },
  );

  test("rechaza datos desconocidos que podrían alterar al cliente o el estado", async () => {
    const response = await submitBooking({
      barber: barberId,
      service: serviceId,
      startTime,
      status: "CONFIRMED",
    });

    expect(response.status).toBe(400);
    expect(Booking.findOne).not.toHaveBeenCalled();
    expect(Booking.create).not.toHaveBeenCalled();
  });

  test("rechaza barberos o servicios inactivos", async () => {
    Service.findById.mockResolvedValue({ durationMinutes: 45, isActive: false });

    const response = await submitBooking({
      barber: barberId,
      service: serviceId,
      startTime,
    });

    expect(response.status).toBe(404);
    expect(Booking.findOne).not.toHaveBeenCalled();
    expect(Booking.create).not.toHaveBeenCalled();
  });
});
