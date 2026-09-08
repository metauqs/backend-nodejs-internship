const Course = require("../models/Course");

async function createCourse(data) {
  const course = new Course(data);
  return await course.save();
}

async function getCourses(filter, projection, sort) {
  return await Course.find(filter).select(projection).sort(sort).lean();
}

async function getCourseById(id) {
  return await Course.findById(id);
}

async function updateCourse(id, data) {
  return await Course.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
}

async function deleteCourse(id) {
  return await Course.findByIdAndDelete(id);
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
