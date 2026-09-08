function validateCourseInput(data, isUpdate) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim().length < 3) {
      errors.push("title must be a string with at least 3 characters");
    }
  }

  if (!isUpdate || data.code !== undefined) {
    if (typeof data.code !== "string" || data.code.trim().length < 3) {
      errors.push("code must be a string with at least 3 characters");
    }
  }

  if (data.durationWeeks !== undefined) {
    if (typeof data.durationWeeks !== "number" || data.durationWeeks < 1) {
      errors.push("durationWeeks must be a number greater than 0");
    }
  }

  if (data.category !== undefined) {
    const allowed = ["Frontend", "Backend", "Database", "Mobile"];
    if (allowed.indexOf(data.category) === -1) {
      errors.push("category must be Frontend, Backend, Database, or Mobile");
    }
  }

  return errors;
}

function validateStudentInput(data, isUpdate) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 2) {
      errors.push("name must be a string with at least 2 characters");
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (typeof data.email !== "string" || data.email.indexOf("@") === -1) {
      errors.push("email must contain @");
    }
  }

  if (data.age !== undefined) {
    if (typeof data.age !== "number" || data.age < 16 || data.age > 100) {
      errors.push("age must be between 16 and 100");
    }
  }

  if (!isUpdate || data.course !== undefined) {
    if (typeof data.course !== "string") {
      errors.push("course must be a valid course id");
    }
  }

  return errors;
}

module.exports = {
  validateCourseInput,
  validateStudentInput
};
