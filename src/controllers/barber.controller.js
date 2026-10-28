const Barber = require("../models/barber.model");

const createProfile = async (req, res) => {
  const body = req.body ?? {};

  if (typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Los datos del perfil no tienen un formato válido",
    });
  }

  const allowedFields = ["bio", "specialties", "yearsExperience"];
  const hasUnknownFields = Object.keys(body).some(
    (field) => !allowedFields.includes(field),
  );

  if (hasUnknownFields) {
    return res.status(400).json({
      success: false,
      message: "El perfil contiene campos no permitidos",
    });
  }

  const profile = {};

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string" || body.bio.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "La descripción debe ser texto de hasta 500 caracteres",
      });
    }

    profile.bio = body.bio.trim();
  }

  if (body.specialties !== undefined) {
    if (
      !Array.isArray(body.specialties) ||
      body.specialties.some(
        (specialty) =>
          typeof specialty !== "string" ||
          !specialty.trim() ||
          specialty.trim().length > 100,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Las especialidades deben ser una lista de textos de hasta 100 caracteres",
      });
    }

    profile.specialties = body.specialties.map((specialty) =>
      specialty.trim(),
    );
  }

  if (body.yearsExperience !== undefined) {
    if (
      !Number.isInteger(body.yearsExperience) ||
      body.yearsExperience < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Los años de experiencia deben ser un entero no negativo",
      });
    }

    profile.yearsExperience = body.yearsExperience;
  }

  try {
    const barber = await Barber.create({
      user: req.user.id,
      ...profile,
    });

    return res.status(201).json({
      success: true,
      barber: {
        id: barber._id,
        bio: barber.bio,
        specialties: barber.specialties,
        yearsExperience: barber.yearsExperience,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un perfil de barbero para este usuario",
      });
    }

    throw error;
  }
};

const listAvailable = async (req, res) => {
  const barbers = await Barber.find({ isActive: true })
    .select("bio specialties yearsExperience")
    .populate("user", "name");

  return res.status(200).json({
    success: true,
    barbers: barbers
      .filter((barber) => barber.user)
      .map((barber) => ({
        id: barber._id,
        name: barber.user.name,
        bio: barber.bio,
        specialties: barber.specialties,
        yearsExperience: barber.yearsExperience,
      })),
  });
};

module.exports = { createProfile, listAvailable };
