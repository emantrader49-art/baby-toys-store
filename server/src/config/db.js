import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[db] MongoDB connection error:", err.message);
    process.exit(1);
  }
}
