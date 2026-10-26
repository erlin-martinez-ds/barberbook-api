const mongoose = require("mongoose");

const barberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario asociado es obligatorio"],
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede superar los 500 caracteres"],
      default: "",
    },
    specialties: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [
            100,
            "Cada especialidad no puede superar los 100 caracteres",
          ],
        },
      ],
      default: [],
      validate: {
        validator: (specialties) =>
          specialties.every((specialty) => specialty.length > 0),
        message: "Las especialidades no pueden estar vacías",
      },
    },
    yearsExperience: {
      type: Number,
      min: [0, "Los años de experiencia no pueden ser negativos"],
      validate: {
        validator: Number.isInteger,
        message: "Los años de experiencia deben ser un número entero",
      },
      default: 0,
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

module.exports = mongoose.model("Barber", barberSchema);
