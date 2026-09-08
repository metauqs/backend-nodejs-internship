const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: user
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body);

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
