const mongoose = require("mongoose");
const Service = require("../src/models/service.model");

describe("Modelo Service", () => {
  test("debe crear un servicio válido", () => {
    const service = new Service({
      name: "Corte clásico",
      description: "Corte tradicional de cabello",
      price: 15000,
      duration: 30,
    });

    const error = service.validateSync();

    expect(error).toBeUndefined();
    expect(service.name).toBe("Corte clásico");
    expect(service.price).toBe(15000);
    expect(service.duration).toBe(30);
    expect(service.isActive).toBe(true);
    expect(service.createdAt).toBeUndefined();
    expect(service.updatedAt).toBeUndefined();
  });

  test("debe rechazar un servicio sin nombre", () => {
    const service = new Service({
      price: 15000,
      duration: 30,
    });

    const error = service.validateSync();

    expect(error.errors.name).toBeDefined();
  });

  test("debe rechazar un precio negativo", () => {
    const service = new Service({
      name: "Corte clásico",
      price: -5000,
      duration: 30,
    });

    const error = service.validateSync();

    expect(error.errors.price).toBeDefined();
  });

  test("debe rechazar una duración decimal", () => {
    const service = new Service({
      name: "Corte clásico",
      price: 15000,
      duration: 30.5,
    });

    const error = service.validateSync();

    expect(error.errors.duration).toBeDefined();
  });

  test("debe rechazar una duración de cero", () => {
    const service = new Service({
      name: "Corte clásico",
      price: 15000,
      duration: 0,
    });

    const error = service.validateSync();

    expect(error.errors.duration).toBeDefined();
  });

  test("debe eliminar espacios sobrantes del nombre", () => {
    const service = new Service({
      name: "  Corte clásico  ",
      price: 15000,
      duration: 30,
    });

    expect(service.name).toBe("Corte clásico");
  });

  test("debe permitir desactivar un servicio", () => {
    const service = new Service({
      name: "Corte clásico",
      price: 15000,
      duration: 30,
      isActive: false,
    });

    expect(service.isActive).toBe(false);
    expect(service.validateSync()).toBeUndefined();
  });
});
