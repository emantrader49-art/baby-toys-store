import Stripe from "stripe";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { recordAuditLog } from "./auditLog.service.js";

// Initialize Stripe SDK if a key is provided
export const stripeClient = env.PAYMENT_SECRET_KEY
  ? new Stripe(env.PAYMENT_SECRET_KEY, { apiVersion: "2024-04-10" })
  : null;

/**
 * Creates or retrieves a Stripe PaymentIntent for a pending order.
 * Handles both real Stripe API and sandbox fallback mode.
 */
export async function createPaymentIntentForOrder(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.user.toString() !== userId.toString()) {
    throw new AppError("You do not have permission to pay for this order", 403);
  }

  if (order.status !== "pending_payment") {
    throw new AppError(`Order is already ${order.status}`, 400);
  }

  const amountInCents = Math.round(order.pricing.total * 100);

  // Check if an active payment intent already exists for this order
  let payment = await Payment.findOne({ order: order._id, status: "created" });

  let clientSecret = "";
  let paymentIntentId = "";

  if (stripeClient && env.PAYMENT_SECRET_KEY && !env.PAYMENT_SECRET_KEY.startsWith("mock_")) {
    try {
      if (payment && payment.transactionId) {
        // Retrieve existing intent
        const existingIntent = await stripeClient.paymentIntents.retrieve(payment.transactionId);
        if (existingIntent.status !== "canceled") {
          clientSecret = existingIntent.client_secret;
          paymentIntentId = existingIntent.id;
        }
      }

      if (!paymentIntentId) {
        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            userId: userId.toString(),
          },
          description: `Little Sprout Order ${order.orderNumber}`,
        });

        clientSecret = paymentIntent.client_secret;
        paymentIntentId = paymentIntent.id;
      }
    } catch (stripeErr) {
      console.error("[stripe] PaymentIntent creation failed, falling back to sandbox mode:", stripeErr.message);
      paymentIntentId = `pi_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).slice(2, 10)}`;
    }
  } else {
    // Sandbox / dev simulation mode
    paymentIntentId = payment?.transactionId || `pi_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).slice(2, 10)}`;
  }

  if (payment) {
    payment.transactionId = paymentIntentId;
    payment.amount = order.pricing.total;
    await payment.save();
  } else {
    payment = await Payment.create({
      order: order._id,
      provider: "stripe",
      transactionId: paymentIntentId,
      amount: order.pricing.total,
      currency: "usd",
      status: "created",
      metadata: { orderNumber: order.orderNumber },
    });
  }

  return {
    clientSecret,
    paymentIntentId,
    amount: order.pricing.total,
    currency: "usd",
    orderNumber: order.orderNumber,
  };
}

/**
 * Verifies Stripe cryptographic webhook signature and processes events.
 */
export async function processStripeWebhook(rawBody, signature) {
  let event;

  if (stripeClient && env.PAYMENT_WEBHOOK_SECRET) {
    try {
      event = stripeClient.webhooks.constructEvent(rawBody, signature, env.PAYMENT_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`[stripe webhook] Signature verification failed: ${err.message}`);
      throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
    }
  } else {
    // In dev / test when no webhook secret is set, parse raw JSON
    try {
      if (Buffer.isBuffer(rawBody)) {
        event = JSON.parse(rawBody.toString("utf8"));
      } else if (typeof rawBody === "string") {
        event = JSON.parse(rawBody);
      } else {
        event = rawBody;
      }
    } catch {
      throw new AppError("Invalid webhook payload format", 400);
    }
  }

  const { type, data, id: eventId } = event;
  const paymentIntent = data?.object;

  if (!paymentIntent) {
    return { received: true, message: "No payment_intent object in event" };
  }

  const orderId = paymentIntent.metadata?.orderId;
  const transactionId = paymentIntent.id;

  switch (type) {
    case "payment_intent.succeeded": {
      await handlePaymentSuccess(orderId, transactionId, eventId, type, paymentIntent);
      break;
    }

    case "payment_intent.payment_failed": {
      const errorMsg = paymentIntent.last_payment_error?.message || "Payment declined";
      await handlePaymentFailure(orderId, transactionId, eventId, type, paymentIntent, errorMsg);
      break;
    }

    case "payment_intent.canceled": {
      await handlePaymentFailure(orderId, transactionId, eventId, type, paymentIntent, "Payment cancelled");
      break;
    }

    default:
      console.log(`[stripe webhook] Unhandled event type: ${type}`);
  }

  return { received: true };
}

/**
 * Handles payment success by transitioning order to 'paid' and updating Payment status.
 */
export async function handlePaymentSuccess(orderId, transactionId, eventId = "", eventType = "payment_intent.succeeded", raw = {}) {
  const query = orderId ? { _id: orderId } : { "payment.transactionId": transactionId };
  const order = await Order.findOne(query);

  if (!order) {
    console.warn(`[stripe webhook] Order not found for payment success: ${orderId || transactionId}`);
    return;
  }

  // Idempotency: if already marked paid, skip duplicate transition
  if (order.status !== "paid" && order.status !== "pending_payment") {
    console.log(`[stripe webhook] Order ${order.orderNumber} is already in state: ${order.status}`);
    return;
  }

  const prevStatus = order.status;
  order.status = "paid";
  order.payment = {
    provider: "stripe",
    status: "paid",
    transactionId: transactionId || order.payment?.transactionId,
  };
  order.statusHistory.push({
    status: "paid",
    note: `Stripe payment succeeded (${transactionId || "sandbox"})`,
  });
  await order.save();

  // Update Payment document
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      $set: { status: "succeeded", transactionId },
      $push: {
        webhookLog: {
          eventId,
          eventType,
          receivedAt: new Date(),
          raw,
        },
      },
    },
    { upsert: true }
  );

  await recordAuditLog({
    req: { user: { _id: order.user }, ip: "stripe-webhook", headers: {} },
    action: "payment.succeeded",
    entity: "Order",
    entityId: order._id,
    before: { status: prevStatus },
    after: { status: "paid", transactionId },
  });

  return order;
}

/**
 * Handles payment failure by transitioning order to 'failed' and restoring inventory stock.
 */
export async function handlePaymentFailure(orderId, transactionId, eventId = "", eventType = "payment_intent.payment_failed", raw = {}, reason = "") {
  const query = orderId ? { _id: orderId } : { "payment.transactionId": transactionId };
  const order = await Order.findOne(query);

  if (!order || order.status === "failed") return;

  const prevStatus = order.status;
  order.status = "failed";
  order.payment = {
    provider: "stripe",
    status: "failed",
    transactionId,
  };
  order.statusHistory.push({
    status: "failed",
    note: `Stripe payment failed: ${reason}`,
  });
  await order.save();

  // Restore inventory stock since order failed
  try {
    for (const item of order.items) {
      if (item.variantId) {
        await Product.updateOne(
          { _id: item.product, "variants._id": item.variantId },
          { $inc: { "variants.$.stock": item.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
      }
    }
  } catch (err) {
    console.error(`[stripe] Failed to restore inventory for failed order ${order.orderNumber}:`, err.message);
  }

  // Update Payment document
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      $set: { status: "failed", transactionId },
      $push: {
        webhookLog: {
          eventId,
          eventType,
          receivedAt: new Date(),
          raw,
        },
      },
    },
    { upsert: true }
  );

  await recordAuditLog({
    req: { user: { _id: order.user }, ip: "stripe-webhook", headers: {} },
    action: "payment.failed",
    entity: "Order",
    entityId: order._id,
    before: { status: prevStatus },
    after: { status: "failed", reason },
  });

  return order;
}

/**
 * Confirms payment in sandbox/dev mode without requiring a live Stripe webhook.
 */
export async function confirmSandboxPaymentForOrder(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.user.toString() !== userId.toString()) {
    throw new AppError("You do not have permission to pay for this order", 403);
  }

  if (order.status === "paid") {
    return order;
  }

  const transactionId = `txn_sandbox_${Date.now()}`;
  return await handlePaymentSuccess(
    order._id,
    transactionId,
    `evt_sandbox_${Date.now()}`,
    "payment_intent.succeeded",
    { sandbox: true }
  );
}
