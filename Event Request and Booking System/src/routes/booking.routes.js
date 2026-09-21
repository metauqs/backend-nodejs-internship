const router = require("express").Router();

const controller = require("../controllers/booking.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { validateObjectIdParam } = require("../validators/booking.validator");

router.get(
  "/my",
  authenticate,
  requireRole("USER"),
  controller.myBookings
);

router.patch(
  "/:id/accept",
  authenticate,
  requireRole("ORGANIZER"),
  validateObjectIdParam("id"),
  controller.acceptBooking
);

router.patch(
  "/:id/reject",
  authenticate,
  requireRole("ORGANIZER"),
  validateObjectIdParam("id"),
  controller.rejectBooking
);

router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("USER"),
  validateObjectIdParam("id"),
  controller.cancelBooking
);

module.exports = router;