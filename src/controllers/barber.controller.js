
const mongoose = require("mongoose");
const Barber = require("../models/barber.model");

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

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Los datos del perfil no son válidos",
        errors: Object.values(error.errors || {}).map(
          (item) => item.message
        ),
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

module.exports = {
  createBarberProfile,
  getBarbers,
  getBarberById,
};
