import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ok } from "../utils/apiResponse.js";

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

// Enriches raw cart items with live product data (price, name, image, stock)
// so the frontend never has to trust stale cached prices.
async function enrichCart(cart) {
  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());
    if (!product) return { ...item.toObject(), unavailable: true };

    const variant = item.variantId ? product.variants.id(item.variantId) : null;
    const price = variant?.price ?? product.price;
    const availableStock = variant?.stock ?? product.stock;

    return {
      _id: item._id,
      product: { _id: product._id, name: product.name, slug: product.slug, image: product.images?.[0]?.url },
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: price,
      lineTotal: Math.round(price * item.quantity * 100) / 100,
      availableStock,
      exceedsStock: item.quantity > availableStock,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  return { _id: cart._id, items, subtotal: Math.round(subtotal * 100) / 100 };
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  return ok(res, await enrichCart(cart));
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || product.status !== "active") throw new AppError("Product not found", 404);

  const availableStock = variantId ? product.variants.id(variantId)?.stock : product.stock;
  if (availableStock === undefined) throw new AppError("Invalid product variant", 400);
  if (quantity > availableStock) throw new AppError("Requested quantity exceeds available stock", 400);

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (i) => i.product.toString() === productId && String(i.variantId || "") === String(variantId || "")
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > availableStock) throw new AppError("Requested quantity exceeds available stock", 400);
    existing.quantity = newQty;
  } else {
    cart.items.push({ product: productId, variantId, quantity });
  }

  await cart.save();
  return ok(res, await enrichCart(cart));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new AppError("Cart item not found", 404);

  const product = await Product.findById(item.product);
  const availableStock = item.variantId ? product?.variants.id(item.variantId)?.stock : product?.stock;
  if (quantity > (availableStock ?? 0)) throw new AppError("Requested quantity exceeds available stock", 400);

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  return ok(res, await enrichCart(cart));
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new AppError("Cart item not found", 404);
  item.deleteOne();
  await cart.save();
  return ok(res, await enrichCart(cart));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  return ok(res, await enrichCart(cart));
});

// Called right after login — merges the guest (localStorage) cart into the DB cart
// without exceeding stock or duplicating lines.
export const mergeGuestCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body; // [{ productId, variantId, quantity }]
  const cart = await getOrCreateCart(req.user._id);

  for (const guestItem of items) {
    const product = await Product.findById(guestItem.productId);
    if (!product || product.status !== "active") continue;

    const availableStock = guestItem.variantId ? product.variants.id(guestItem.variantId)?.stock : product.stock;
    if (availableStock === undefined) continue;

    const existing = cart.items.find(
      (i) =>
        i.product.toString() === guestItem.productId &&
        String(i.variantId || "") === String(guestItem.variantId || "")
    );
    const requestedQty = existing ? existing.quantity + guestItem.quantity : guestItem.quantity;
    const finalQty = Math.min(requestedQty, availableStock);

    if (existing) existing.quantity = finalQty;
    else cart.items.push({ product: guestItem.productId, variantId: guestItem.variantId, quantity: finalQty });
  }

  await cart.save();
  return ok(res, await enrichCart(cart));
});
