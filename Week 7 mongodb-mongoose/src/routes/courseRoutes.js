const express = require("express");
const controller = require("../controllers/courseController");

const router = express.Router();

router.post("/", controller.createCourse);
router.get("/", controller.getCourses);
router.get("/:id", controller.getCourse);
router.patch("/:id", controller.updateCourse);
router.delete("/:id", controller.deleteCourse);

module.exports = router;
