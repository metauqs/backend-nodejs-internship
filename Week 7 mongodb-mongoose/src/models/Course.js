const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    durationWeeks: {
      type: Number,
      required: true,
      min: 1
    },
    category: {
      type: String,
      enum: ["Frontend", "Backend", "Database", "Mobile"],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

courseSchema.methods.getCourseSummary = function () {
  return this.title + " (" + this.code + ")";
};

module.exports = mongoose.model("Course", courseSchema);
