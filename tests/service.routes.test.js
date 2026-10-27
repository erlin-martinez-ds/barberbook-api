const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Service = require("../src/models/service.model");
const User = require("../src/models/user.model");
const app = require("../src/app");

jest.mock("../src/models/service.model");
jest.mock("../src/models/user.model");

const JWT_SECRET = "clave-de-prueba-segura-para-jwt";
const adminId = new mongoose.Types.ObjectId().toString();

const createToken = (role = "ADMIN", userId = adminId) =>
  jwt.sign({ role }, JWT_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });

const validService = {
  _id: new mongoose.Types.ObjectId().toString(),
  name: "Corte clásico",
  description: "Corte tradicional de cabello",
  price: 15000,
  duration: 30,
  isActive: true,
};

const mockAdmin = (role = "ADMIN") => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: adminId,
      role,
    }),
  });
};

describe("Endpoints de servicios", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/services", () => {
    test("lista los servicios activos", async () => {
      const sort = jest.fn().mockResolvedValue([validService]);
      Service.find.mockReturnValue({ sort });

      const response = await request(app).get("/api/services");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.services).toHaveLength(1);
      expect(Service.find).toHaveBeenCalledWith({ isActive: true });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    test("devuelve una lista vacía si no hay servicios activos", async () => {
      const sort = jest.fn().mockResolvedValue([]);
      Service.find.mockReturnValue({ sort });

      const response = await request(app).get("/api/services");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.services).toEqual([]);
    });
  });

  describe("GET /api/services/:id", () => {
    test("devuelve un servicio activo", async () => {
      Service.findOne.mockResolvedValue(validService);

      const response = await request(app).get(
        `/api/services/${validService._id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.service.name).toBe("Corte clásico");
      expect(Service.findOne).toHaveBeenCalledWith({
        _id: validService._id,
        isActive: true,
      });
    });

    test("rechaza un identificador inválido", async () => {
      const response = await request(app).get("/api/services/id-invalido");

      expect(response.status).toBe(400);
      expect(Service.findOne).not.toHaveBeenCalled();
    });

    test("devuelve 404 si el servicio no existe o está inactivo", async () => {
      Service.findOne.mockResolvedValue(null);

      const response = await request(app).get(
        `/api/services/${validService._id}`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/services", () => {
    test("rechaza la petición sin token", async () => {
      const response = await request(app)
        .post("/api/services")
        .send(validService);

      expect(response.status).toBe(401);
      expect(Service).not.toHaveBeenCalled();
    });

    test("rechaza a un usuario con rol USER", async () => {
      const token = createToken("USER");
      mockAdmin("USER");

      const response = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${token}`)
        .send(validService);

      expect(response.status).toBe(403);
      expect(Service).not.toHaveBeenCalled();
    });

    test("crea un servicio con rol ADMIN", async () => {
      const token = createToken("ADMIN");
      mockAdmin("ADMIN");

      const save = jest.fn().mockResolvedValue(undefined);

      Service.mockImplementation(function (data) {
        Object.assign(this, data);
        this.save = save;
      });

      const response = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Corte clásico",
          description: "Corte tradicional",
          price: 15000,
          duration: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(save).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/services/:id/availability", () => {
    test("rechaza el cambio de disponibilidad sin token", async () => {
      const response = await request(app)
        .patch(`/api/services/${validService._id}/availability`)
        .send({ isActive: false });

      expect(response.status).toBe(401);
    });

    test("rechaza un usuario sin rol ADMIN", async () => {
      const token = createToken("BARBER");
      mockAdmin("BARBER");

      const response = await request(app)
        .patch(`/api/services/${validService._id}/availability`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isActive: false });

      expect(response.status).toBe(403);
    });

    test("desactiva un servicio con rol ADMIN", async () => {
      const token = createToken("ADMIN");
      mockAdmin("ADMIN");

      const service = {
        ...validService,
        save: jest.fn().mockResolvedValue(undefined),
      };

      Service.findById.mockResolvedValue(service);

      const response = await request(app)
        .patch(`/api/services/${validService._id}/availability`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(service.isActive).toBe(false);
      expect(service.save).toHaveBeenCalled();
    });

    test("rechaza un valor de disponibilidad que no sea booleano", async () => {
      const token = createToken("ADMIN");
      mockAdmin("ADMIN");

      const response = await request(app)
        .patch(`/api/services/${validService._id}/availability`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isActive: "false" });

      expect(response.status).toBe(400);
      expect(Service.findById).not.toHaveBeenCalled();
    });
  });
});
