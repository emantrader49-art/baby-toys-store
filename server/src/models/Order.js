import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "failed",
  "cancel_requested",
  "cancelled",
  "return_requested",
  "returned",
  "rejected",
];

// Allowed forward transitions — enforced server-side, never arbitrary.
export const ORDER_TRANSITIONS = {
  pending_payment: ["paid", "failed"],
  paid: ["processing"],
  processing: ["packed", "cancel_requested"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: ["return_requested"],
  cancel_requested: ["cancelled"],
  return_requested: ["returned", "rejected"],
  failed: [],
  cancelled: [],
  returned: [],
  rejected: [],
};

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: mongoose.Schema.Types.ObjectId,
    name: String,
    sku: String,
    image: String,
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [orderItemSchema],
    pricing: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, required: true, default: 0 },
      discount: { type: Number, required: true, default: 0 },
      total: { type: Number, required: true },
    },
    address: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shipping: {
      method: String,
      estimatedDays: Number,
    },
    payment: {
      provider: String,
      status: { type: String, enum: ["unpaid", "paid", "failed", "refunded"], default: "unpaid" },
      transactionId: String,
    },
    coupon: {
      code: String,
      discountApplied: Number,
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment", index: true },
    statusHistory: [statusHistorySchema],
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);
