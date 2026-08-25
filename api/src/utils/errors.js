
class AppError extends Error {
  constructor(message, code, statusCode = 400, details = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }
  console.error(err);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    details: {},
  });
}

module.exports = { AppError, errorHandler };