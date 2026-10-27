
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del servicio es obligatorio"],
      trim: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [100, "El nombre no puede superar los 100 caracteres"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "La descripción no puede superar los 500 caracteres",
      ],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "El precio del servicio es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },

    duration: {
      type: Number,
      required: [true, "La duración del servicio es obligatoria"],
      min: [1, "La duración debe ser de al menos 1 minuto"],
      validate: {
        validator: Number.isInteger,
        message: "La duración debe ser un número entero",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Service", serviceSchema);
