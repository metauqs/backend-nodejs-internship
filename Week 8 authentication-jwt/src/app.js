const express = require("express");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.get("/", function (req, res) {
  res.status(200).json({
    success: true,
    message: "Authentication API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
