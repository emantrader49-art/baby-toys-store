import { Router } from "express";
import {
  createIntent,
  handleWebhook,
  getPaymentByOrderId,
  confirmSandbox,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Stripe Webhook — public route with signature verification in service
router.post("/webhook", handleWebhook);

// Authenticated customer endpoints
router.post("/create-intent", authenticate, createIntent);
router.post("/confirm-sandbox", authenticate, confirmSandbox);
router.get("/order/:orderId", authenticate, getPaymentByOrderId);

export default router;
