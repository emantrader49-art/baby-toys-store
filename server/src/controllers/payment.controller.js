import { asyncHandler } from "../middleware/errorHandler.js";
import { ok, created } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import {
  createPaymentIntentForOrder,
  processStripeWebhook,
  confirmSandboxPaymentForOrder,
} from "../services/stripe.service.js";

/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent for a pending order.
 */
export const createIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    throw new AppError("orderId is required", 400);
  }

  const result = await createPaymentIntentForOrder(orderId, req.user._id);
  return created(res, result);
});

/**
 * POST /api/payments/webhook
 * Receives webhook events from Stripe and verifies cryptographic signatures.
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"] || "";
  // Use rawBody buffer or raw body string if available, otherwise req.body
  const rawPayload = req.rawBody || req.body;

  const result = await processStripeWebhook(rawPayload, signature);
  return ok(res, result);
});

/**
 * GET /api/payments/order/:orderId
 * Fetches the payment record and status for an order.
 */
export const getPaymentByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  const isStaff = ["staff", "admin"].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw new AppError("You do not have permission to view payment for this order", 403);
  }

  const payment = await Payment.findOne({ order: orderId });
  return ok(res, {
    payment: payment || null,
    orderStatus: order.status,
    paymentStatus: order.payment?.status || "unpaid",
  });
});

/**
 * POST /api/payments/confirm-sandbox
 * Sandbox / dev test helper for immediate order payment confirmation.
 */
export const confirmSandbox = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    throw new AppError("orderId is required", 400);
  }

  const order = await confirmSandboxPaymentForOrder(orderId, req.user._id);
  return ok(res, order);
});
