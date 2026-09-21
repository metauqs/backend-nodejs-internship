const bookingService = require("../services/booking.service");
const { successResponse } = require("../utils/apiResponse");

async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(
      req.params.eventId,
      req.user._id
    );

    successResponse(res, 201, booking, "Booking request created");
  } catch (error) {
    next(error);
  }
}

async function myBookings(req, res, next) {
  try {
    const result = await bookingService.getMyBookings(
      req.user._id,
      req.query
    );

    successResponse(res, 200, result, "Bookings fetched");
  } catch (error) {
    next(error);
  }
}

async function eventBookings(req, res, next) {
  try {
    const result = await bookingService.getEventBookings(
      req.params.eventId,
      req.user._id,
      req.query
    );

    successResponse(res, 200, result, "Event bookings fetched");
  } catch (error) {
    next(error);
  }
}

async function acceptBooking(req, res, next) {
  try {
    const booking = await bookingService.acceptBooking(
      req.params.id,
      req.user._id
    );

    successResponse(res, 200, booking, "Booking accepted");
  } catch (error) {
    next(error);
  }
}

async function rejectBooking(req, res, next) {
  try {
    const booking = await bookingService.rejectBooking(
      req.params.id,
      req.user._id
    );

    successResponse(res, 200, booking, "Booking rejected");
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id
    );

    successResponse(res, 200, booking, "Booking cancelled");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  myBookings,
  eventBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking
};