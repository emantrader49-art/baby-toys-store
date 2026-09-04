import { Wishlist } from "../models/Wishlist.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ok } from "../utils/apiResponse.js";

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
}

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await (await getOrCreateWishlist(req.user._id)).populate("products");
  return ok(res, wishlist);
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  if (!wishlist.products.some((p) => p.toString() === req.params.productId)) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }
  return ok(res, wishlist);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
  await wishlist.save();
  return ok(res, wishlist);
});
