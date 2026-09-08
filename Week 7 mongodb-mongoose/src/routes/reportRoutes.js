const express = require("express");
const controller = require("../controllers/reportController");

const router = express.Router();

router.get("/students-by-course", controller.studentsByCourse);
router.get("/average-age-by-course", controller.averageAgeByCourse);
router.get("/course-capacity", controller.courseCapacity);
router.get("/students-by-city", controller.studentsByCity);
router.get("/course-student-details", controller.courseStudentDetails);

module.exports = router;
