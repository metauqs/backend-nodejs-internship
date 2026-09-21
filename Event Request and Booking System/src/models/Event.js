const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    imagePublicId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);