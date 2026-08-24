const { AppError } = require("../utils/errors");
 
const VALID_STATUS = ["todo", "in_progress", "review", "done"];
const VALID_PRIORITY = ["low", "medium", "high", "urgent"];
 
function validateCreateTask(body) {
  const errors = {};
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    errors.title = "Title is required";
  }
  if (!body.project_id) {
    errors.project_id = "project_id is required";
  }
  if (body.status && !VALID_STATUS.includes(body.status)) {
    errors.status = `Must be one of: ${VALID_STATUS.join(", ")}`;
  }
  if (body.priority && !VALID_PRIORITY.includes(body.priority)) {
    errors.priority = `Must be one of: ${VALID_PRIORITY.join(", ")}`;
  }
  if (Object.keys(errors).length) {
    throw new AppError("Validation failed", "VALIDATION_ERROR", 422, errors);
  }
  return {
    title: body.title.trim(),
    description: body.description || null,
    status: body.status || "todo",
    priority: body.priority || "medium",
    project_id: body.project_id,
    due_date: body.due_date ? new Date(body.due_date) : null,
  };
}
 



function validateUpdateTask(body) {
  const errors = {};
  if (body.status && !VALID_STATUS.includes(body.status)) {
    errors.status = `Must be one of: ${VALID_STATUS.join(", ")}`;
  }
  if (body.priority && !VALID_PRIORITY.includes(body.priority)) {
    errors.priority = `Must be one of: ${VALID_PRIORITY.join(", ")}`;
  }
  if (Object.keys(errors).length) {
    throw new AppError("Validation failed", "VALIDATION_ERROR", 422, errors);
  }
  return body;
}
 
module.exports = { validateCreateTask, validateUpdateTask };