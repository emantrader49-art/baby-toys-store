import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    fullName: String,
    phone: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: String,
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "PK" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    phone: { type: String, trim: true },
    addresses: [addressSchema],
    lastLogin: Date,
    refreshTokenVersion: { type: Number, default: 0 }, // bump to invalidate all refresh tokens
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
};

export const User = mongoose.model("User", userSchema);
