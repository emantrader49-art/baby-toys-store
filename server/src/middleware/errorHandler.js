import { env } from "../config/env.js";

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Invalid ObjectId cast
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }

  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err.details ? { details: err.details } : {}),
      ...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    },
  });
}

// Wrap async route handlers so rejected promises reach errorHandler
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
