import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";
import { asyncHandler } from "./errorHandler.js";

// Verifies the access token from the Authorization header and attaches req.user
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  const user = await User.findById(payload.sub).select("-passwordHash");
  if (!user || user.status !== "active") {
    throw new AppError("Account not found or inactive", 401);
  }

  req.user = user;
  next();
});

// Role-based authorization. Security lives here on the backend —
// hiding a button in the UI is never sufficient on its own.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
}
