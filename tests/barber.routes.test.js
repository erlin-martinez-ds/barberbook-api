jest.mock("../src/models/barber.model");
jest.mock("../src/models/user.model");

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Barber = require("../src/models/barber.model");
const User = require("../src/models/user.model");
const app = require("../src/app");

const JWT_SECRET = "clave-de-prueba-segura-para-jwt";

const createToken = (role = "BARBER", userId = "usuario123") =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const validBarber = {
  _id: new mongoose.Types.ObjectId().toString(),
  user: {
    _id: "usuario123",
    name: "Barbero Prueba",
  },
  bio: "Especialista en cortes modernos",
  specialties: ["Degradados"],
  yearsExperience: 5,
  isActive: true,
};

describe("Endpoints de barberos", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/barbers", () => {
    test("lista los perfiles activos y devuelve HTTP 200", async () => {
      const populate = jest.fn().mockReturnThis();
      const sort = jest.fn().mockResolvedValue([validBarber]);

      Barber.find.mockReturnValue({ populate });
      populate.mockReturnValue({ sort });

      const response = await request(app).get("/api/barbers");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.barbers).toHaveLength(1);
      expect(Barber.find).toHaveBeenCalledWith({ isActive: true });
      expect(populate).toHaveBeenCalledWith("user", "name");
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    test("devuelve una lista vacía cuando no hay barberos activos", async () => {
      const populate = jest.fn().mockReturnThis();
      const sort = jest.fn().mockResolvedValue([]);

      Barber.find.mockReturnValue({ populate });
      populate.mockReturnValue({ sort });

      const response = await request(app).get("/api/barbers");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.barbers).toEqual([]);
    });

    test("propaga los errores inesperados al middleware", async () => {
      Barber.find.mockImplementation(() => {
        throw new Error("Error de base de datos");
      });

      const response = await request(app).get("/api/barbers");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/barbers/:id", () => {
    test("devuelve un barbero existente con HTTP 200", async () => {
      const populate = jest.fn().mockResolvedValue(validBarber);

      Barber.findOne.mockReturnValue({ populate });

      const response = await request(app).get(
        `/api/barbers/${validBarber._id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Barber.findOne).toHaveBeenCalledWith({
        _id: validBarber._id,
        isActive: true,
      });
      expect(populate).toHaveBeenCalledWith("user", "name");
    });

    test("rechaza un identificador inválido con HTTP 400", async () => {
      const response = await request(app).get("/api/barbers/id-invalido");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(Barber.findOne).not.toHaveBeenCalled();
    });

    test("devuelve HTTP 404 si el barbero no existe", async () => {
      const populate = jest.fn().mockResolvedValue(null);

      Barber.findOne.mockReturnValue({ populate });

      const id = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/barbers/${id}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/barbers", () => {
    test("rechaza la petición sin token con HTTP 401", async () => {
      const response = await request(app).post("/api/barbers").send({
        bio: "Perfil de prueba",
      });

      expect(response.status).toBe(401);
      expect(Barber).not.toHaveBeenCalled();
    });

    test("rechaza a un usuario con rol USER con HTTP 403", async () => {
      const token = createToken("USER");

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "usuario123",
          role: "USER",
        }),
      });

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bio: "Perfil de prueba",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(Barber).not.toHaveBeenCalled();
    });

    test("crea un perfil con rol BARBER y devuelve HTTP 201", async () => {
      const token = createToken("BARBER");
      const savedBarber = {
        ...validBarber,
        populate: jest.fn().mockResolvedValue(validBarber),
        save: jest.fn().mockResolvedValue(undefined),
      };

      Barber.mockImplementation(function (data) {
        Object.assign(this, data);
        this.save = savedBarber.save;
        this.populate = savedBarber.populate;
      });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "usuario123",
          role: "BARBER",
        }),
      });

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bio: "Especialista en cortes modernos",
          specialties: ["Degradados"],
          yearsExperience: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(Barber).toHaveBeenCalledWith({
        user: "usuario123",
        bio: "Especialista en cortes modernos",
        specialties: ["Degradados"],
        yearsExperience: 5,
      });
      expect(savedBarber.save).toHaveBeenCalled();
    });

    test("rechaza un perfil duplicado con HTTP 409", async () => {
      const token = createToken("BARBER");

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "usuario123",
          role: "BARBER",
        }),
      });

      Barber.mockImplementation(function () {
        this.save = jest.fn().mockRejectedValue({
          code: 11000,
        });
      });

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bio: "Perfil duplicado",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });
});
