const mongoose = require("mongoose");

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const bookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El cliente es obligatorio"],
    },
    barber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barber",
      required: [true, "El barbero es obligatorio"],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "El servicio es obligatorio"],
    },
    date: {
      type: String,
      required: [true, "La fecha es obligatoria"],
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "La fecha debe tener el formato YYYY-MM-DD",
      ],
    },
    startTime: {
      type: String,
      required: [true, "La hora de inicio es obligatoria"],
      match: [timePattern, "La hora debe tener el formato HH:mm"],
    },
    endTime: {
      type: String,
      required: [true, "La hora de fin es obligatoria"],
      match: [timePattern, "La hora debe tener el formato HH:mm"],
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
