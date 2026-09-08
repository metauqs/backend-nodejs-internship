const reportService = require("../services/reportService");

async function studentsByCourse(req, res, next) {
  try {
    const data = await reportService.studentsByCourse();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function averageAgeByCourse(req, res, next) {
  try {
    const data = await reportService.averageAgeByCourse();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function courseCapacity(req, res, next) {
  try {
    const data = await reportService.courseCapacity();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function studentsByCity(req, res, next) {
  try {
    const data = await reportService.studentsByCity();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function courseStudentDetails(req, res, next) {
  try {
    const data = await reportService.courseStudentDetails();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  studentsByCourse,
  averageAgeByCourse,
  courseCapacity,
  studentsByCity,
  courseStudentDetails
};
