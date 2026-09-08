const Student = require("../models/Student");

async function createStudent(data) {
  const student = new Student(data);
  return await student.save();
}

async function getStudents(filter, projection, sort) {
  return await Student.find(filter).select(projection).sort(sort).lean();
}

async function getStudentById(id) {
  return await Student.findById(id);
}

async function getStudentWithCourse(id) {
  return await Student.findById(id).populate(
    "course",
    "title code category durationWeeks"
  );
}

async function updateStudent(id, data) {
  return await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
}

async function deleteStudent(id) {
  return await Student.findByIdAndDelete(id);
}

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  getStudentWithCourse,
  updateStudent,
  deleteStudent
};
