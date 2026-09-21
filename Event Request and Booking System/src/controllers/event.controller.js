const eventService = require("../services/event.service");
const { successResponse } = require("../utils/apiResponse");

async function createEvent(req, res, next) {
  try {
    const event = await eventService.createEvent(
      req.body,
      req.user._id,
      req.file
    );

    successResponse(res, 201, event, "Event created");
  } catch (error) {
    next(error);
  }
}

async function listEvents(req, res, next) {
  try {
    const result = await eventService.listEvents(req.query);
    successResponse(res, 200, result, "Events fetched");
  } catch (error) {
    next(error);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id);
    successResponse(res, 200, event, "Event fetched");
  } catch (error) {
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.user._id,
      req.body,
      req.file
    );

    successResponse(res, 200, event, "Event updated");
  } catch (error) {
    next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    await eventService.deleteEvent(req.params.id, req.user._id);
    successResponse(res, 200, null, "Event deleted");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent
};