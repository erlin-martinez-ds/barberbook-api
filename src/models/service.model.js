const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del servicio es obligatorio"],
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "La duración del servicio es obligatoria"],
      min: [1, "La duración debe ser de al menos un minuto"],
      validate: {
        validator: Number.isInteger,
        message: "La duración debe ser un número entero de minutos",
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
