import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, enum: ["stripe", "paypal"], required: true },
    transactionId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["created", "succeeded", "failed", "cancelled", "expired", "refunded"],
      default: "created",
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    webhookLog: [
      {
        eventId: String,
        eventType: String,
        receivedAt: { type: Date, default: Date.now },
        raw: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
