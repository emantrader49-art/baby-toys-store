import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, default: 0 },
    maxDiscount: Number,
    usageLimit: Number,
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    startsAt: Date,
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", couponSchema);
