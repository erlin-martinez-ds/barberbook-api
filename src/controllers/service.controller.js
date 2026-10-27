const mongoose = require("mongoose");
const Service = require("../models/service.model");

const createService = async (req, res, next) => {
  try {
    const service = new Service({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      duration: req.body.duration,
      isActive: req.body.isActive,
    });

    await service.save();

    return res.status(201).json({
      success: true,
      message: "Servicio creado correctamente",
      service,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Los datos del servicio no son válidos",
        errors: Object.values(error.errors || {}).map((item) => item.message),
      });
    }

    return next(error);
  }
};

const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    return next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "El identificador del servicio no es válido",
      });
    }

    const service = await Service.findOne({
      _id: id,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    return next(error);
  }
};

const updateServiceAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "El identificador del servicio no es válido",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "El campo isActive debe ser true o false",
      });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    service.isActive = isActive;
    await service.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Servicio activado correctamente"
        : "Servicio desactivado correctamente",
      service,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Los datos del servicio no son válidos",
        errors: Object.values(error.errors || {}).map((item) => item.message),
      });
    }

    return next(error);
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateServiceAvailability,
};
