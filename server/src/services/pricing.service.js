import { Coupon } from "../models/Coupon.js";
import { AppError } from "../utils/AppError.js";

// Flat shipping rule set — replace with real configurable rules later.
// Kept simple and explicit so it's easy to explain in evaluation.
export function calculateShipping(subtotal) {
  if (subtotal >= 50) return 0; // free shipping over $50
  if (subtotal === 0) return 0;
  return 4.99;
}

// Validates a coupon code server-side against the order's subtotal and the user's usage.
// Returns the discount amount in currency units, never trusting any discount sent from the client.
export async function validateAndApplyCoupon({ code, subtotal, userId, Order }) {
  if (!code) return { discount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) throw new AppError("Invalid or inactive coupon code", 400);

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new AppError("Coupon is not active yet", 400);
  if (coupon.expiresAt && now > coupon.expiresAt) throw new AppError("Coupon has expired", 400);
  if (subtotal < coupon.minimumOrder) {
    throw new AppError(`Order must be at least ${coupon.minimumOrder} to use this coupon`, 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  if (coupon.perUserLimit) {
    const usedByUser = await Order.countDocuments({
      user: userId,
      "coupon.code": coupon.code,
      status: { $ne: "cancelled" },
    });
    if (usedByUser >= coupon.perUserLimit) {
      throw new AppError("You have already used this coupon the maximum number of times", 400);
    }
  }

  let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal); // never discount below zero

  return { discount: Math.round(discount * 100) / 100, coupon };
}
