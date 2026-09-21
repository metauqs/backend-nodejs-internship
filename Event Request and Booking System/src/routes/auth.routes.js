const router = require("express").Router();

const controller = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const {
  validateRegister,
  validateLogin
} = require("../validators/auth.validator");

router.post("/register", validateRegister, controller.register);
router.post("/login", validateLogin, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);

module.exports = router;