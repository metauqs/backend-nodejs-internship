const studentService = require("../services/studentService");

async function createStudent(req, res, next) {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
}

async function getStudents(req, res, next) {
  try {
    const students = await studentService.getStudents(req.query);
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
}

async function getStudent(req, res, next) {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
}

async function getStudentDetails(req, res, next) {
  try {
    const student = await studentService.getStudentWithCourse(req.params.id);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const student = await studentService.deleteStudent(req.params.id);
    res.status(200).json({ success: true, message: "Student deleted", data: student });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  getStudentDetails,
  updateStudent,
  deleteStudent
};
