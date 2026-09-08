const express = require("express");
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.get("/profile", authenticate, userController.getProfile);
router.get("/private", authenticate, userController.getPrivate);

module.exports = router;
