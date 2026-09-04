import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    orderItem: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: { type: String, required: true },
    images: [String],
    verifiedPurchase: { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  },
  { timestamps: true }
);

// One review per user per product (update policy instead of duplicates)
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
