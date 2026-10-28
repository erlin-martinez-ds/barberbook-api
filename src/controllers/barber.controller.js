const mongoose = require("mongoose");
const Barber = require("../models/barber.model");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");

const createBarberProfile = async (req, res, next) => {
  try {
    const barber = new Barber({
      user: req.user.id,
      bio: req.body.bio,
      specialties: req.body.specialties,
      yearsExperience: req.body.yearsExperience,
    });

    await barber.save();
    await barber.populate("user", "name");

    return res.status(201).json({
      success: true,
      message: "Perfil de barbero creado correctamente",
      barber,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "El usuario ya tiene un perfil de barbero",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Los datos del perfil no son válidos",
        errors: Object.values(error.errors || {}).map((item) => item.message),
      });
    }

    return next(error);
  }
};

const getBarbers = async (req, res, next) => {
  try {
    const barbers = await Barber.find({ isActive: true })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: barbers.length,
      barbers,
    });
  } catch (error) {
    return next(error);
  }
};

const getBarberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "El identificador del barbero no es válido",
      });
    }

    const barber = await Barber.findOne({
      _id: id,
      isActive: true,
    }).populate("user", "name");

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: "Barbero no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      barber,
    });
  } catch (error) {
    return next(error);
  }
};

const createBarberAccount = async (req, res, next) => {
  let createdUser;

  try {
    const {
      name,
      email,
      password,
      bio,
      specialties,
      yearsExperience,
      isActive,
    } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Nombre, correo y contraseña son obligatorios",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "El formato del correo electrónico no es válido",
      });
    }

    const passwordBytes = Buffer.byteLength(password, "utf8");

    if (password.length < 8 || passwordBytes > 72) {
      return res.status(400).json({
        success: false,
        message:
          "La contraseña debe tener al menos 8 caracteres y máximo 72 bytes",
      });
    }

    if (
      bio !== undefined &&
      (typeof bio !== "string" || bio.trim().length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "La descripción debe ser texto de máximo 500 caracteres",
      });
    }

    if (
      specialties !== undefined &&
      (!Array.isArray(specialties) ||
        !specialties.every(
          (item) => typeof item === "string" && item.trim().length > 0,
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Las especialidades deben ser una lista de textos válidos",
      });
    }

    if (
      yearsExperience !== undefined &&
      (!Number.isInteger(yearsExperience) || yearsExperience < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Los años de experiencia deben ser un entero no negativo",
      });
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "El estado activo debe ser verdadero o falso",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con ese correo electrónico",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "BARBER",
    });

    const barber = await Barber.create({
      user: createdUser._id,
      bio: bio?.trim() ?? "",
      specialties: specialties?.map((item) => item.trim()) ?? [],
      yearsExperience: yearsExperience ?? 0,
      isActive: isActive ?? true,
    });

    await barber.populate("user", "name email role");

    return res.status(201).json({
      success: true,
      message: "Cuenta y perfil de barbero creados correctamente",
      barber,
    });
  } catch (error) {
    if (createdUser?._id) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        return next(cleanupError);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario o perfil con esos datos",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Los datos del barbero no son válidos",
        errors: Object.values(error.errors || {}).map((item) => item.message),
      });
    }

    return next(error);
  }
};

module.exports = {
  createBarberProfile,
  createBarberAccount,
  getBarbers,
  getBarberById,
};
