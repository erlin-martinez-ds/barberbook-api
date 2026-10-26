const mongoose = require("mongoose");
const Barber = require("../src/models/barber.model");

describe("Modelo Barber", () => {
  const validUserId = new mongoose.Types.ObjectId();

  test("debe aceptar un perfil de barbero válido", () => {
    const barber = new Barber({
      user: validUserId,
      bio: "Barbero especializado en cortes modernos",
      specialties: ["Degradados", "Arreglo de barba"],
      yearsExperience: 5,
    });

    expect(barber.validateSync()).toBeUndefined();
  });

  test("debe exigir una referencia al usuario", () => {
    const barber = new Barber({
      bio: "Perfil profesional",
    });

    const error = barber.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  test("debe asignar valores predeterminados", () => {
    const barber = new Barber({
      user: validUserId,
    });

    expect(barber.bio).toBe("");
    expect(barber.specialties).toEqual([]);
    expect(barber.yearsExperience).toBe(0);
    expect(barber.isActive).toBe(true);
    expect(barber.validateSync()).toBeUndefined();
  });

  test("no debe aceptar años de experiencia negativos", () => {
    const barber = new Barber({
      user: validUserId,
      yearsExperience: -1,
    });

    const error = barber.validateSync();

    expect(error.errors.yearsExperience).toBeDefined();
  });

  test("no debe aceptar años de experiencia decimales", () => {
    const barber = new Barber({
      user: validUserId,
      yearsExperience: 2.5,
    });

    const error = barber.validateSync();

    expect(error.errors.yearsExperience).toBeDefined();
  });

  test("no debe aceptar una descripción de más de 500 caracteres", () => {
    const barber = new Barber({
      user: validUserId,
      bio: "a".repeat(501),
    });

    const error = barber.validateSync();

    expect(error.errors.bio).toBeDefined();
  });

  test("no debe aceptar especialidades de más de 100 caracteres", () => {
    const barber = new Barber({
      user: validUserId,
      specialties: ["a".repeat(101)],
    });

    const error = barber.validateSync();

    expect(error).toBeDefined();
    expect(
      Object.keys(error.errors).some((path) => path.startsWith("specialties")),
    ).toBe(true);
  });

  test("no debe aceptar especialidades vacías", () => {
    const barber = new Barber({
      user: validUserId,
      specialties: ["   "],
    });

    const error = barber.validateSync();

    expect(error.errors.specialties).toBeDefined();
  });
});
