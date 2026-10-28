jest.mock("../src/models/user.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/barber.model", () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user.model");
const Barber = require("../src/models/barber.model");
const app = require("../src/app");

describe("Rutas de perfiles de barberos", () => {
  const authSecret = "clave-de-prueba-segura-para-jwt";

  const createToken = (role = "BARBER") =>
    jwt.sign({ role }, authSecret, {
      subject: "barbero123",
      expiresIn: "1h",
    });

  const authorizeAs = (role) => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = authSecret;
  });

  describe("POST /api/barbers", () => {
    test("requiere autenticación", async () => {
      const response = await request(app)
        .post("/api/barbers")
        .send({ bio: "Cortes modernos" });

      expect(response.status).toBe(401);
      expect(Barber.create).not.toHaveBeenCalled();
    });

    test("permite crear un perfil solo a usuarios BARBER", async () => {
      authorizeAs("USER");

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${createToken("USER")}`)
        .send({ bio: "Cortes modernos" });

      expect(response.status).toBe(403);
      expect(Barber.create).not.toHaveBeenCalled();
    });

    test("crea el perfil asociado al usuario autenticado", async () => {
      authorizeAs("BARBER");
      Barber.create.mockImplementation(async (profile) => ({
        _id: "perfil123",
        ...profile,
      }));

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({
          bio: "  Especialista en cortes modernos  ",
          specialties: [" Degradados ", "Barba"],
          yearsExperience: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.barber).toEqual({
        id: "perfil123",
        bio: "Especialista en cortes modernos",
        specialties: ["Degradados", "Barba"],
        yearsExperience: 5,
      });
      expect(Barber.create).toHaveBeenCalledWith({
        user: "barbero123",
        bio: "Especialista en cortes modernos",
        specialties: ["Degradados", "Barba"],
        yearsExperience: 5,
      });
      expect(response.body.barber.email).toBeUndefined();
      expect(response.body.barber.password).toBeUndefined();
    });

    test.each([
      [{ bio: "x".repeat(501) }],
      [{ bio: 123 }],
      [{ specialties: "Degradados" }],
      [{ specialties: ["   "] }],
      [{ specialties: ["x".repeat(101)] }],
      [{ yearsExperience: -1 }],
      [{ yearsExperience: 2.5 }],
      [{ user: "otro-usuario" }],
      [{ isActive: false }],
    ])("rechaza datos inválidos con HTTP 400", async (body) => {
      authorizeAs("BARBER");

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${createToken()}`)
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(Barber.create).not.toHaveBeenCalled();
    });

    test("rechaza un perfil duplicado con HTTP 409", async () => {
      authorizeAs("BARBER");
      Barber.create.mockRejectedValue({ code: 11000 });

      const response = await request(app)
        .post("/api/barbers")
        .set("Authorization", `Bearer ${createToken()}`)
        .send({ bio: "Perfil existente" });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/barbers", () => {
    test("lista perfiles activos sin incluir información privada", async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([
          {
            _id: "perfil123",
            bio: "Cortes modernos",
            specialties: ["Degradados"],
            yearsExperience: 5,
            isActive: true,
            user: {
              _id: "barbero123",
              name: "Barbero de Prueba",
              email: "privado@example.com",
              password: "hash",
            },
          },
          {
            _id: "perfil-huerfano",
            bio: "Sin cuenta",
            user: null,
          },
        ]),
      };
      Barber.find.mockReturnValue(query);

      const response = await request(app).get("/api/barbers");

      expect(response.status).toBe(200);
      expect(response.body.barbers).toEqual([
        {
          id: "perfil123",
          name: "Barbero de Prueba",
          bio: "Cortes modernos",
          specialties: ["Degradados"],
          yearsExperience: 5,
        },
      ]);
      expect(Barber.find).toHaveBeenCalledWith({ isActive: true });
      expect(query.select).toHaveBeenCalledWith(
        "bio specialties yearsExperience",
      );
      expect(query.populate).toHaveBeenCalledWith("user", "name");
      expect(JSON.stringify(response.body)).not.toContain("privado@example.com");
      expect(JSON.stringify(response.body)).not.toContain("password");
    });
  });
});
