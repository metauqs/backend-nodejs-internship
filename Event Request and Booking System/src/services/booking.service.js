const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Event = require("../models/Event");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { getPagination, buildPagination } = require("../utils/pagination");
const { sendBookingDecisionEmail } = require("./email.service");

async function createBooking(eventId, userId) {
  const event = await Event.findById(eventId);

  if (!event) throw new AppError("Event not found", 404);

  if (event.date <= new Date()) {
    throw new AppError("Cannot book an event that has already started", 400);
  }

  const existing = await Booking.findOne({
    event: event._id,
    user: userId
  });

  if (existing) {
    throw new AppError(
      `You already have a ${existing.status.toLowerCase()} booking for this event`,
      409
    );
  }

  const acceptedCount = await Booking.countDocuments({
    event: event._id,
    status: "ACCEPTED"
  });

  if (acceptedCount >= event.capacity) {
    throw new AppError("Event capacity has been reached", 409);
  }

  return Booking.create({
    event: event._id,
    user: userId,
    status: "PENDING"
  });
}

async function getMyBookings(userId, query) {
  const { page, limit, skip } = getPagination(query);

  const filter = { user: userId };

  if (query.status) {
    const allowed = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"];

    if (!allowed.includes(query.status)) {
      throw new AppError("Invalid booking status filter", 400);
    }

    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("event")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
}

async function getEventBookings(eventId, organizerId, query) {
  const event = await Event.findById(eventId);

  if (!event) throw new AppError("Event not found", 404);

  if (event.organizer.toString() !== organizerId.toString()) {
    throw new AppError("You can only manage bookings for your own events", 403);
  }

  const { page, limit, skip } = getPagination(query);
  const filter = { event: eventId };

  if (query.status) {
    const allowed = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"];
    if (!allowed.includes(query.status)) {
      throw new AppError("Invalid booking status filter", 400);
    }
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("user", "name email role")
      .populate("event", "title date location capacity")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
}

async function ensureBookingOwnerOrOrganizer(bookingId, organizerId) {
  const booking = await Booking.findById(bookingId)
    .populate("event")
    .populate("user", "name email");

  if (!booking) throw new AppError("Booking not found", 404);

  if (
    !booking.event ||
    booking.event.organizer.toString() !== organizerId.toString()
  ) {
    throw new AppError("You can only manage bookings for your own events", 403);
  }

  return booking;
}

async function acceptBooking(bookingId, organizerId) {
  const booking = await ensureBookingOwnerOrOrganizer(
    bookingId,
    organizerId
  );

  if (booking.status !== "PENDING") {
    throw new AppError("Only pending bookings can be accepted", 400);
  }

  const acceptedCount = await Booking.countDocuments({
    event: booking.event._id,
    status: "ACCEPTED"
  });

  if (acceptedCount >= booking.event.capacity) {
    throw new AppError("Event capacity has been reached", 409);
  }

  booking.status = "ACCEPTED";
  await booking.save();

  // Send notification email — failure must not block the API response
  sendBookingDecisionEmail({
    to: booking.user.email,
    userName: booking.user.name,
    eventTitle: booking.event.title,
    eventDate: booking.event.date,
    eventLocation: booking.event.location,
    status: "ACCEPTED"
  }).catch((err) =>
    console.error("[email] Failed to send acceptance email:", err.message)
  );

  return booking;
}

async function rejectBooking(bookingId, organizerId) {
  const booking = await ensureBookingOwnerOrOrganizer(
    bookingId,
    organizerId
  );

  if (booking.status !== "PENDING") {
    throw new AppError("Only pending bookings can be rejected", 400);
  }

  booking.status = "REJECTED";
  await booking.save();

  // Send notification email — failure must not block the API response
  sendBookingDecisionEmail({
    to: booking.user.email,
    userName: booking.user.name,
    eventTitle: booking.event.title,
    eventDate: booking.event.date,
    eventLocation: booking.event.location,
    status: "REJECTED"
  }).catch((err) =>
    console.error("[email] Failed to send rejection email:", err.message)
  );

  return booking;
}

async function cancelBooking(bookingId, userId) {
  const booking = await Booking.findById(bookingId).populate(
    "event",
    "title date location capacity organizer"
  );

  if (!booking) throw new AppError("Booking not found", 404);

  if (booking.user.toString() !== userId.toString()) {
    throw new AppError("You can only cancel your own booking", 403);
  }

  if (booking.status !== "ACCEPTED") {
    throw new AppError("Only accepted bookings can be cancelled", 400);
  }

  booking.status = "CANCELLED";
  await booking.save();

  return booking;
}

module.exports = {
  createBooking,
  getMyBookings,
  getEventBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking
};