const express = require("express");
const controller = require("../controllers/studentController");

const router = express.Router();

router.post("/", controller.createStudent);
router.get("/", controller.getStudents);
router.get("/:id/details", controller.getStudentDetails);
router.get("/:id", controller.getStudent);
router.patch("/:id", controller.updateStudent);
router.delete("/:id", controller.deleteStudent);

module.exports = router;
