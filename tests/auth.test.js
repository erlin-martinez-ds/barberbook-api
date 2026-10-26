jest.mock("../src/models/user.model");

const request = require("supertest");
const bcrypt = require("bcrypt");
const User = require("../src/models/user.model");
const app = require("../src/app");

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
