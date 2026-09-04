import { Review } from "../models/Review.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { created, ok } from "../utils/apiResponse.js";

export const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id, moderationStatus: "approved" })
    .populate("user", "name")
    .sort({ createdAt: -1 });
  return ok(res, reviews);
});

export const createReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, images } = req.body;
  const productId = req.params.id;

  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) throw new AppError("You have already reviewed this product. Edit your existing review instead.", 409);

  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    status: "delivered",
    "items.product": productId,
  });

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    orderItem: deliveredOrder?._id,
    rating,
    title,
    comment,
    images,
    verifiedPurchase: Boolean(deliveredOrder),
    moderationStatus: "pending",
  });

  return created(res, review);
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);
  if (review.user.toString() !== req.user._id.toString()) {
    throw new AppError("You can only edit your own review", 403);
  }
  const { rating, title, comment, images } = req.body;
  Object.assign(review, { rating, title, comment, images, moderationStatus: "pending" });
  await review.save();
  return ok(res, review);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);
  const isOwner = review.user.toString() === req.user._id.toString();
  const isStaff = ["staff", "admin"].includes(req.user.role);
  if (!isOwner && !isStaff) throw new AppError("You do not have permission to delete this review", 403);
  await review.deleteOne();
  return ok(res, { message: "Review deleted" });
});

// Staff/admin moderation — approving recalculates the product's rating aggregate.
export const moderateReview = asyncHandler(async (req, res) => {
  const { status } = req.body; // "approved" | "rejected"
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);

  review.moderationStatus = status;
  await review.save();

  if (status === "approved") {
    const approvedReviews = await Review.find({ product: review.product, moderationStatus: "approved" });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    approvedReviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    });
    const average = approvedReviews.length ? Math.round((sum / approvedReviews.length) * 10) / 10 : 0;

    await Product.findByIdAndUpdate(review.product, {
      "rating.average": average,
      "rating.count": approvedReviews.length,
      "rating.distribution": distribution,
    });
  }

  return ok(res, review);
});
