const { AppError } = require("../utils/errors");

function validateCreateProject(body) {
  const errors = {};
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.name = "Name is required";
  }
  if (Object.keys(errors).length) {
    throw new AppError("Validation failed", "VALIDATION_ERROR", 422, errors);
  }
  return { name: body.name.trim(), description: body.description || null };
}

module.exports.validateCreateProject = validateCreateProject;