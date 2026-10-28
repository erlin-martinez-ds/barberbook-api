jest.mock("../src/models/barber.model");
jest.mock("../src/models/user.model");

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Barber = require("../src/models/barber.model");
const User = require("../src/models/user.model");
const app = require("../src/app");

const JWT_SECRET = "clave-de-prueba-segura-para-jwt";
const adminId = new mongoose.Types.ObjectId().toString();

const createToken = (role = "ADMIN", userId = adminId) =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const validPayload = {
  name: "Carlos Pérez",
  email: "carlos@example.com",
  password: "ClaveSegura123",
  bio: "Especialista en cortes clásicos",
  specialties: ["Corte clásico", "Barba"],
  yearsExperience: 5,
  isActive: true,
};

describe("POST /api/barbers/admin", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: adminId,
        role: "ADMIN",
      }),
    });

    User.findOne.mockResolvedValue(null);
  });

  test("rechaza la petición sin token con HTTP 401", async () => {
    const response = await request(app)
      .post("/api/barbers/admin")
      .send(validPayload);

    expect(response.status).toBe(401);
    expect(User.create).not.toHaveBeenCalled();
    expect(Barber.create).not.toHaveBeenCalled();
  });

  test("rechaza a un usuario USER con HTTP 403", async () => {
    const token = createToken("USER", "usuario-normal");

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "usuario-normal",
        role: "USER",
      }),
    });

    const response = await request(app)
      .post("/api/barbers/admin")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(403);
    expect(User.create).not.toHaveBeenCalled();
    expect(Barber.create).not.toHaveBeenCalled();
  });

  test("crea la cuenta BARBER y su perfil con HTTP 201", async () => {
    const token = createToken();
    const userId = new mongoose.Types.ObjectId();

    User.create.mockResolvedValue({
      _id: userId,
      name: validPayload.name,
      email: validPayload.email,
      role: "BARBER",
    });

    const savedBarber = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      bio: validPayload.bio,
      specialties: validPayload.specialties,
      yearsExperience: validPayload.yearsExperience,
      isActive: true,
      populate: jest.fn().mockResolvedValue(undefined),
    };

    Barber.create.mockResolvedValue(savedBarber);

    const response = await request(app)
      .post("/api/barbers/admin")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        email: validPayload.email,
        role: "BARBER",
      }),
    );

    const userData = User.create.mock.calls[0][0];

    expect(userData.password).not.toBe(validPayload.password);
    expect(await bcrypt.compare(validPayload.password, userData.password)).toBe(
      true,
    );

    expect(Barber.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: userId,
        bio: validPayload.bio,
        specialties: validPayload.specialties,
        yearsExperience: 5,
        isActive: true,
      }),
    );
  });

  test("rechaza un correo que ya existe con HTTP 409", async () => {
    const token = createToken();

    User.findOne.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      email: validPayload.email,
    });

    const response = await request(app)
      .post("/api/barbers/admin")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);

    expect(response.status).toBe(409);
    expect(User.create).not.toHaveBeenCalled();
    expect(Barber.create).not.toHaveBeenCalled();
  });

  test("rechaza una contraseña demasiado corta con HTTP 400", async () => {
    const token = createToken();

    const response = await request(app)
      .post("/api/barbers/admin")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validPayload,
        password: "abc123",
      });

    expect(response.status).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  test("elimina la cuenta si falla la creación del perfil", async () => {
    const token = createToken();
    const userId = new mongoose.Types.ObjectId();

    User.create.mockResolvedValue({
      _id: userId,
      name: validPayload.name,
      email: validPayload.email,
      role: "BARBER",
    });

    Barber.create.mockRejectedValue(
      new Error("Error simulado al crear el perfil"),
    );

    User.findByIdAndDelete.mockResolvedValue({ _id: userId });

    const response = await request(app)
      .post("/api/barbers/admin")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);

    expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId);
    expect(response.status).toBe(500);
  });
});
