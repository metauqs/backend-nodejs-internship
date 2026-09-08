const courseRepository = require("../repositories/courseRepository");
const ApiError = require("../utils/ApiError");
const validateObjectId = require("../utils/validateObjectId");
const { validateCourseInput } = require("../utils/manualValidators");

function buildCourseFilter(query) {
  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  return filter;
}

async function createCourse(data) {
  const errors = validateCourseInput(data, false);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  try {
    return await courseRepository.createCourse(data);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Course code already exists");
    }
    throw error;
  }
}

async function getCourses(query) {
  const filter = buildCourseFilter(query);
  const projection = query.fields || "";
  const sort = query.sort || "-createdAt";

  return await courseRepository.getCourses(filter, projection, sort);
}

async function getCourseById(id) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid course ID");
  }

  const course = await courseRepository.getCourseById(id);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return course;
}

async function updateCourse(id, data) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid course ID");
  }

  const errors = validateCourseInput(data, true);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  try {
    const course = await courseRepository.updateCourse(id, data);

    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    return course;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Course code already exists");
    }
    throw error;
  }
}

async function deleteCourse(id) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid course ID");
  }

  const course = await courseRepository.deleteCourse(id);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return course;
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
