const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
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
    startTime: {
      type: Date,
      required: [true, "La fecha y hora de inicio son obligatorias"],
    },
    endTime: {
      type: Date,
      required: [true, "La fecha y hora de finalización son obligatorias"],
      validate: {
        validator(endTime) {
          return !this.startTime || endTime > this.startTime;
        },
        message: "La hora de finalización debe ser posterior al inicio",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
        message: "El estado de la reserva no es válido",
      },
      default: "PENDING",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

bookingSchema.index({ barber: 1, status: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
