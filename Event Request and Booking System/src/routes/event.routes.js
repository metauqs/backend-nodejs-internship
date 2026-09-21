const router = require("express").Router();

const controller = require("../controllers/event.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");
const {
  validateEventInput,
  validateEventPatch
} = require("../validators/event.validator");
const {
  validateObjectIdParam
} = require("../validators/booking.validator");

router.get("/", controller.listEvents);
router.get(
  "/:id",
  validateObjectIdParam("id"),
  controller.getEvent
);

router.post(
  "/",
  authenticate,
  requireRole("ORGANIZER"),
  upload.single("image"),
  validateEventInput,
  controller.createEvent
);

router.patch(
  "/:id",
  authenticate,
  requireRole("ORGANIZER"),
  validateObjectIdParam("id"),
  upload.single("image"),
  validateEventPatch,
  controller.updateEvent
);

router.delete(
  "/:id",
  authenticate,
  requireRole("ORGANIZER"),
  validateObjectIdParam("id"),
  controller.deleteEvent
);

const bookingController = require("../controllers/booking.controller");

router.post(
  "/:eventId/bookings",
  authenticate,
  requireRole("USER"),
  validateObjectIdParam("eventId"),
  bookingController.createBooking
);

router.get(
  "/:eventId/bookings",
  authenticate,
  requireRole("ORGANIZER"),
  validateObjectIdParam("eventId"),
  bookingController.eventBookings
);

module.exports = router;