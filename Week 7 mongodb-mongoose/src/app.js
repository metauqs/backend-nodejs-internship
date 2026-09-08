const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.get("/", function (req, res) {
  res.json({
    success: true,
    message: "Friday MongoDB & Mongoose Exercise API"
  });
});

app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
