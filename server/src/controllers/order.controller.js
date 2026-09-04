import mongoose from "mongoose";
import { Order, ORDER_TRANSITIONS } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { calculateShipping, validateAndApplyCoupon } from "../services/pricing.service.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { recordAuditLog } from "../services/auditLog.service.js";

// POST /api/orders
// This is the most security-sensitive endpoint in the app: it revalidates
// stock and price server-side, never trusts any total sent from the client,
// and is idempotent so a double-click or network retry can't create two orders.
export const createOrder = asyncHandler(async (req, res) => {
  const { address, shippingMethod, couponCode, idempotencyKey } = req.body;

  if (!idempotencyKey) throw new AppError("idempotencyKey is required", 400);

  const existingOrder = await Order.findOne({ idempotencyKey });
  if (existingOrder) {
    // Same request retried — return the original order instead of creating a duplicate.
    return created(res, existingOrder);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) throw new AppError("Cart is empty", 400);

  const orderItems = [];
  let subtotal = 0;

  // Revalidate every line against the live product/variant — current price and current stock.
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || product.status !== "active") {
      throw new AppError(`A product in your cart is no longer available`, 400);
    }
    const variant = item.variantId ? product.variants.id(item.variantId) : null;
    const price = variant?.price ?? product.price;
    const availableStock = variant?.stock ?? product.stock;

    if (item.quantity > availableStock) {
      throw new AppError(`Not enough stock for ${product.name}`, 409);
    }

    orderItems.push({
      product: product._id,
      variantId: item.variantId,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      image: product.images?.[0]?.url,
      unitPrice: price,
      quantity: item.quantity,
    });
    subtotal += price * item.quantity;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  const { discount, coupon } = await validateAndApplyCoupon({
    code: couponCode,
    subtotal,
    userId: req.user._id,
    Order,
  });
  const shipping = calculateShipping(subtotal - discount);
  const total = Math.round((subtotal - discount + shipping) * 100) / 100;

  // Decrement stock + create the order in a single logical unit.
  // Supports MongoDB replica sets with transactions and falls back gracefully for standalone/in-memory environments.
  const executeOrderCreation = async (session = null) => {
    const opts = session ? { session } : {};
    for (const item of orderItems) {
      const product = await (session ? Product.findById(item.product).session(session) : Product.findById(item.product));
      if (!product) throw new AppError("Product not found", 404);
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant || variant.stock < item.quantity) throw new AppError(`Not enough stock for ${item.name}`, 409);
        variant.stock -= item.quantity;
      } else {
        if (product.stock < item.quantity) throw new AppError(`Not enough stock for ${item.name}`, 409);
        product.stock -= item.quantity;
      }
      await product.save(opts);
    }

    const createdOrders = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          user: req.user._id,
          items: orderItems,
          pricing: { subtotal, shipping, discount, total },
          address,
          shipping: { method: shippingMethod || "standard", estimatedDays: 5 },
          payment: { provider: "stripe", status: "unpaid" },
          coupon: coupon ? { code: coupon.code, discountApplied: discount } : undefined,
          status: "pending_payment",
          statusHistory: [{ status: "pending_payment", actor: req.user._id }],
          idempotencyKey,
        },
      ],
      opts
    );
    order = createdOrders[0];

    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save(opts);
    }

    cart.items = [];
    await cart.save(opts);
  };

  let order;
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await executeOrderCreation(session);
      });
    } finally {
      session.endSession();
    }
  } catch (txErr) {
    if (txErr.message?.includes("replica set") || txErr.code === 20 || txErr.codeName === "IllegalOperation") {
      await executeOrderCreation(null);
    } else {
      throw txErr;
    }
  }

  return created(res, order);
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return ok(res, orders);
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email"),
    Order.countDocuments(filter),
  ]);
  return ok(res, items, { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  const isOwner = order.user.toString() === req.user._id.toString();
  const isStaff = ["staff", "admin"].includes(req.user.role);
  if (!isOwner && !isStaff) throw new AppError("You do not have permission to view this order", 403);

  return ok(res, order);
});

// PATCH /api/orders/:id/status — staff/admin only, validates the transition
// against the fixed state machine instead of allowing arbitrary status changes.
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status: nextStatus, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  const allowed = ORDER_TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Cannot transition order from "${order.status}" to "${nextStatus}"`, 400);
  }

  const before = order.status;
  order.status = nextStatus;
  order.statusHistory.push({ status: nextStatus, actor: req.user._id, note });
  await order.save();

  await recordAuditLog({
    req,
    action: "order.status_change",
    entity: "Order",
    entityId: order._id,
    before: { status: before },
    after: { status: nextStatus },
  });

  return ok(res, order);
});
