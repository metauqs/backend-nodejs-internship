const authService = require("../services/auth.service");
const { successResponse } = require("../utils/apiResponse");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    successResponse(res, 201, result, "Registration successful");
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    successResponse(res, 200, result, "Login successful");
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);
    successResponse(res, 200, result, "Tokens refreshed");
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body.refreshToken);
    successResponse(res, 200, null, "Logout successful");
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    successResponse(
      res,
      200,
      authService.publicUser(req.user),
      "Current user"
    );
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, logout, me };