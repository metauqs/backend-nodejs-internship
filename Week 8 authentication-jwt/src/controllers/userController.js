const userService = require("../services/userService");

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function getPrivate(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: "You successfully accessed a protected route",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  getPrivate
};
