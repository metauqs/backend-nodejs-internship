const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      select: false
    },
    role: {
      type: String,
      enum: ["USER", "ORGANIZER"],
      default: "USER"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);