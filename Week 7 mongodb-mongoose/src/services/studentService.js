const studentRepository = require("../repositories/studentRepository");
const courseRepository = require("../repositories/courseRepository");
const ApiError = require("../utils/ApiError");
const validateObjectId = require("../utils/validateObjectId");
const { validateStudentInput } = require("../utils/manualValidators");

function buildStudentFilter(query) {
  const filter = {};

  if (query.city) {
    filter.city = query.city;
  }

  return filter;
}

async function ensureCourseExists(courseId) {
  if (!validateObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  const course = await courseRepository.getCourseById(courseId);

  if (!course) {
    throw new ApiError(404, "Referenced course does not exist");
  }
}

async function createStudent(data) {
  const errors = validateStudentInput(data, false);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  await ensureCourseExists(data.course);

  try {
    return await studentRepository.createStudent(data);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Student email already exists");
    }
    throw error;
  }
}

async function getStudents(query) {
  const filter = buildStudentFilter(query);
  const projection = query.fields || "";
  const sort = query.sort || "-createdAt";

  return await studentRepository.getStudents(filter, projection, sort);
}

async function getStudentById(id) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid student ID");
  }

  const student = await studentRepository.getStudentById(id);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
}

async function getStudentWithCourse(id) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid student ID");
  }

  const student = await studentRepository.getStudentWithCourse(id);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
}

async function updateStudent(id, data) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid student ID");
  }

  const errors = validateStudentInput(data, true);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  if (data.course !== undefined) {
    await ensureCourseExists(data.course);
  }

  try {
    const student = await studentRepository.updateStudent(id, data);

    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    return student;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Student email already exists");
    }
    throw error;
  }
}

async function deleteStudent(id) {
  if (!validateObjectId(id)) {
    throw new ApiError(400, "Invalid student ID");
  }

  const student = await studentRepository.deleteStudent(id);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
}

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  getStudentWithCourse,
  updateStudent,
  deleteStudent
};
