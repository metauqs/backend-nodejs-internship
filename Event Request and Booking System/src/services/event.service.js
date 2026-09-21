const Event = require("../models/Event");
const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const { getPagination, buildPagination } = require("../utils/pagination");
const { uploadBuffer, deleteImage } = require("./upload.service");

function buildEventFilter(query) {
  const filter = {};

  if (query.search) {
    filter.title = { $regex: query.search.trim(), $options: "i" };
  }

  if (query.date) {
    const start = new Date(query.date);
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};

    if (query.dateFrom) {
      const from = new Date(query.dateFrom);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        filter.date.$gte = from;
      }
    }

    if (query.dateTo) {
      const to = new Date(query.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        filter.date.$lte = to;
      }
    }

    if (!Object.keys(filter.date).length) delete filter.date;
  }

  return filter;
}

async function createEvent(data, organizerId, file) {
  let image = {};

  if (file) {
    image = await uploadBuffer(file.buffer);
  }

  return Event.create({
    ...data,
    capacity: Number(data.capacity),
    organizer: organizerId,
    ...(
      file
        ? { imageUrl: image.url, imagePublicId: image.publicId }
        : {}
    )
  });
}

async function listEvents(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = buildEventFilter(query);

  const allowedSort = {
    date: "date",
    title: "title",
    createdAt: "createdAt"
  };

  const sortField = allowedSort[query.sort] || "date";
  const sortOrder = query.order === "desc" ? -1 : 1;

  const [items, total] = await Promise.all([
    Event.find(filter)
      .populate("organizer", "name email")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
}

async function getEventById(id) {
  const event = await Event.findById(id).populate(
    "organizer",
    "name email"
  );

  if (!event) throw new AppError("Event not found", 404);

  return event;
}

async function updateEvent(id, organizerId, data, file) {
  const event = await Event.findById(id);

  if (!event) throw new AppError("Event not found", 404);

  if (event.organizer.toString() !== organizerId.toString()) {
    throw new AppError("You can only modify your own events", 403);
  }

  const previousPublicId = event.imagePublicId;

  if (file) {
    const image = await uploadBuffer(file.buffer);
    data.imageUrl = image.url;
    data.imagePublicId = image.publicId;
  }

  if (data.capacity !== undefined) {
    data.capacity = Number(data.capacity);
  }

  Object.assign(event, data);
  await event.save();

  if (file && previousPublicId) {
    await deleteImage(previousPublicId);
  }

  return event;
}

async function deleteEvent(id, organizerId) {
  const event = await Event.findById(id);

  if (!event) throw new AppError("Event not found", 404);

  if (event.organizer.toString() !== organizerId.toString()) {
    throw new AppError("You can only delete your own events", 403);
  }

  const activeBookings = await Booking.countDocuments({
    event: event._id,
    status: { $in: ["PENDING", "ACCEPTED"] }
  });

  if (activeBookings > 0) {
    throw new AppError(
      "Cannot delete an event with pending or accepted bookings",
      409
    );
  }

  await event.deleteOne();

  if (event.imagePublicId) {
    await deleteImage(event.imagePublicId);
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent
};