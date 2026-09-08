const courseService = require("../services/courseService");

async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

async function getCourses(req, res, next) {
  try {
    const courses = await courseService.getCourses(req.query);
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    next(error);
  }
}

async function getCourse(req, res, next) {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const course = await courseService.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: "Course deleted", data: course });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse
};
