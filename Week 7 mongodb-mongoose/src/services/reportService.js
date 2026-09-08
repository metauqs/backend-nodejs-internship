const Student = require("../models/Student");
const Course = require("../models/Course");

async function studentsByCourse() {
  return await Student.aggregate([
    {
      $group: {
        _id: "$course",
        totalStudents: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course"
      }
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        courseName: "$course.title",
        courseCode: "$course.code",
        totalStudents: 1
      }
    },
    { $sort: { totalStudents: -1 } }
  ]);
}

async function averageAgeByCourse() {
  return await Student.aggregate([
    {
      $group: {
        _id: "$course",
        averageAge: { $avg: "$age" },
        totalStudents: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course"
      }
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        course: "$course.title",
        averageAge: 1,
        totalStudents: 1
      }
    },
    { $sort: { averageAge: -1 } }
  ]);
}

async function courseCapacity() {
  return await Course.aggregate([
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "course",
        as: "students"
      }
    },
    {
      $project: {
        title: 1,
        code: 1,
        category: 1,
        totalStudents: { $size: "$students" }
      }
    },
    { $sort: { totalStudents: -1 } }
  ]);
}

async function studentsByCity() {
  return await Student.aggregate([
    {
      $group: {
        _id: "$city",
        totalStudents: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        city: "$_id",
        totalStudents: 1
      }
    },
    { $sort: { totalStudents: -1 } }
  ]);
}

async function courseStudentDetails() {
  return await Student.aggregate([
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseDetails"
      }
    },
    { $unwind: "$courseDetails" },
    {
      $project: {
        name: 1,
        email: 1,
        age: 1,
        city: 1,
        courseName: "$courseDetails.title",
        courseCode: "$courseDetails.code"
      }
    },
    { $sort: { courseName: 1, name: 1 } }
  ]);
}

module.exports = {
  studentsByCourse,
  averageAgeByCourse,
  courseCapacity,
  studentsByCity,
  courseStudentDetails
};
