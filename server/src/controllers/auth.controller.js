import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../services/token.service.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, phone });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return created(res, { user: user.toSafeJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || user.status !== "active") {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return ok(res, { user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new AppError("No refresh token provided", 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active" || user.refreshTokenVersion !== payload.v) {
    throw new AppError("Refresh token no longer valid", 401);
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());

  return ok(res, { accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      // Bump refreshTokenVersion to invalidate this (and any other outstanding) refresh token
      await User.findByIdAndUpdate(payload.sub, { $inc: { refreshTokenVersion: 1 } });
    } catch {
      // token already invalid — nothing to do
    }
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  return ok(res, { message: "Logged out" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists,
  // to avoid leaking which emails are registered.
  if (user) {
    // In production: generate a reset token, store its hash + expiry, email a reset link.
    // Sandbox/demo behavior: log it instead of sending a real email.
    console.log(`[auth] Password reset requested for ${email}`);
  }

  return ok(res, { message: "If that email is registered, a reset link has been sent." });
});
