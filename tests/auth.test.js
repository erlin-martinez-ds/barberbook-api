jest.mock("../src/models/user.model");

const request = require("supertest");
const bcrypt = require("bcrypt");
const User = require("../src/models/user.model");
const app = require("../src/app");
const jwt = require("jsonwebtoken");

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validUser = {
    name: "Usuario Prueba",
    email: "prueba@example.com",
    password: "ClaveSegura123!",
  };

  test("registra un usuario y devuelve HTTP 201", async () => {
    User.create.mockImplementation(async (data) => ({
      _id: "usuario123",
      ...data,
    }));

    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("prueba@example.com");
    expect(response.body.user.role).toBe("USER");
    expect(response.body.user.password).toBeUndefined();
  });

  test("cifra la contraseña antes de guardarla", async () => {
    User.create.mockImplementation(async (data) => ({
      _id: "usuario123",
      ...data,
    }));

    await request(app).post("/api/auth/register").send(validUser);

    const savedUser = User.create.mock.calls[0][0];

    expect(savedUser.password).not.toBe(validUser.password);
    await expect(
      bcrypt.compare(validUser.password, savedUser.password),
    ).resolves.toBe(true);
  });

  test("ignora un rol ADMIN enviado por el cliente", async () => {
    User.create.mockImplementation(async (data) => ({
      _id: "usuario123",
      ...data,
    }));

    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, role: "ADMIN" });

    expect(response.status).toBe(201);
    expect(User.create.mock.calls[0][0].role).toBe("USER");
    expect(response.body.user.role).toBe("USER");
  });

  test.each([
    [{ email: "prueba@example.com", password: "ClaveSegura123!" }],
    [{ name: "   ", email: "prueba@example.com", password: "ClaveSegura123!" }],
    [{ ...validUser, email: "correo-invalido" }],
    [{ ...validUser, password: "123" }],
    [{ ...validUser, password: "a".repeat(73) }],
  ])("rechaza datos inválidos con HTTP 400", async (body) => {
    const response = await request(app).post("/api/auth/register").send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(User.create).not.toHaveBeenCalled();
  });

  test("rechaza un correo duplicado con HTTP 409", async () => {
    User.create.mockRejectedValue({
      code: 11000,
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test("normaliza el correo y el nombre antes de guardar", async () => {
    User.create.mockImplementation(async (data) => ({
      _id: "usuario123",
      ...data,
    }));

    await request(app).post("/api/auth/register").send({
      name: "  Usuario Prueba  ",
      email: " PRUEBA@EXAMPLE.COM ",
      password: "ClaveSegura123!",
    });

    const savedUser = User.create.mock.calls[0][0];

    expect(savedUser.name).toBe("Usuario Prueba");
    expect(savedUser.email).toBe("prueba@example.com");
  });
});

describe("POST /api/auth/login", () => {
  const validUser = {
    _id: "usuario123",
    name: "Usuario Prueba",
    email: "prueba@example.com",
    password: "$2b$12$hashDePrueba",
    role: "USER",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "clave-de-prueba-segura-para-jwt";
    User.findOne = jest.fn();
  });

  test("rechaza solicitudes sin correo o contraseña", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "prueba@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("responde 401 cuando el usuario no existe", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "inexistente@example.com",
      password: "ClaveSegura123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciales incorrectas");
  });

  test("rechaza un token ausente en el middleware", () => {
    const authMiddleware = require("../src/middlewares/auth.middleware");
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("verifica que un JWT válido contenga el usuario y el rol", () => {
    const authMiddleware = require("../src/middlewares/auth.middleware");
    const token = jwt.sign({ role: "USER" }, process.env.JWT_SECRET, {
      subject: "usuario123",
      expiresIn: "1h",
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({
      id: "usuario123",
      role: "USER",
    });
    expect(next).toHaveBeenCalled();
  });

  test("inicia sesión con credenciales correctas y devuelve un JWT", async () => {
    const password = "ClaveSegura123!";

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        ...validUser,
        password: "hash-de-prueba",
      }),
    });

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const response = await request(app).post("/api/auth/login").send({
      email: "PRUEBA@example.com",
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));

    expect(response.body.user).toEqual({
      id: "usuario123",
      name: "Usuario Prueba",
      email: "prueba@example.com",
      role: "USER",
    });

    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);

    expect(decoded.sub).toBe("usuario123");
    expect(decoded.role).toBe("USER");
    expect(User.findOne).toHaveBeenCalledWith({
      email: "prueba@example.com",
    });
  });

  test("rechaza una contraseña incorrecta", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        ...validUser,
        password: "hash-de-prueba",
      }),
    });

    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const response = await request(app).post("/api/auth/login").send({
      email: "prueba@example.com",
      password: "ContraseñaIncorrecta123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Credenciales incorrectas");
    expect(response.body.token).toBeUndefined();
  });
});
