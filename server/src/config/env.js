import dotenv from "dotenv";
dotenv.config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // Don't crash in dev if it's missing; log a warning instead.
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return val;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: required("MONGO_URI", "mongodb://127.0.0.1:27017/baby-toys-store"),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  PAYMENT_SECRET_KEY: process.env.PAYMENT_SECRET_KEY || "",
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || "",
};
