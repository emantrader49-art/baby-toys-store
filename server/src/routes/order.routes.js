import { Router } from "express";
import {
  createOrder,
  listMyOrders,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", (req, res, next) => {
  // Staff/admin see all orders (with filters); customers see only their own.
  if (["staff", "admin"].includes(req.user.role)) return listAllOrders(req, res, next);
  return listMyOrders(req, res, next);
});
router.get("/:id", getOrderById);
router.patch("/:id/status", authorize("staff", "admin"), updateOrderStatus);

export default router;
