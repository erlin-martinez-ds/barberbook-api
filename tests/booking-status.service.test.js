const {
  BOOKING_STATUS,
  canTransitionBookingStatus,
} = require("../src/services/booking-status.service");

describe("Servicio de transiciones de estado de reservas", () => {
  it.each([
    ["PENDING", "CONFIRMED"],
    ["PENDING", "REJECTED"],
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "CANCELLED"],
    ["CONFIRMED", "COMPLETED"],
  ])("permite la transición %s -> %s", (current, next) => {
    expect(canTransitionBookingStatus(current, next)).toBe(true);
  });

  it.each([
    ["PENDING", "PENDING"],
    ["CONFIRMED", "CONFIRMED"],
    ["CANCELLED", "CONFIRMED"],
    ["CANCELLED", "REJECTED"],
    ["REJECTED", "CONFIRMED"],
    ["REJECTED", "CANCELLED"],
    ["COMPLETED", "CONFIRMED"],
    ["COMPLETED", "CANCELLED"],
    ["UNKNOWN", "CONFIRMED"],
  ])("rechaza la transición %s -> %s", (current, next) => {
    expect(canTransitionBookingStatus(current, next)).toBe(false);
  });

  it("define los estados principales de las reservas", () => {
    expect(BOOKING_STATUS.PENDING).toBe("PENDING");
    expect(BOOKING_STATUS.CONFIRMED).toBe("CONFIRMED");
    expect(BOOKING_STATUS.REJECTED).toBe("REJECTED");
    expect(BOOKING_STATUS.CANCELLED).toBe("CANCELLED");
    expect(BOOKING_STATUS.COMPLETED).toBe("COMPLETED");
  });
});
