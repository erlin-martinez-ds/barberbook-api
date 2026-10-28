const BOOKING_STATUS = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
});

const ALLOWED_TRANSITIONS = Object.freeze({
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "COMPLETED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
});

const canTransitionBookingStatus = (currentStatus, nextStatus) => {
  return (
    Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, currentStatus) &&
    ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)
  );
};

module.exports = {
  BOOKING_STATUS,
  ALLOWED_TRANSITIONS,
  canTransitionBookingStatus,
};
