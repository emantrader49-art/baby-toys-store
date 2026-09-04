import { Router } from "express";
import {
  getDashboardOverview,
  getSalesTrends,
  getTopProducts,
  getCategoryPerformance,
  getInventoryAlerts,
  getRecentActivities,
} from "../controllers/analytics.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All analytics routes require staff or admin privileges
router.use(authenticate, authorize("staff", "admin"));

router.get("/overview", getDashboardOverview);
router.get("/sales-trends", getSalesTrends);
router.get("/top-products", getTopProducts);
router.get("/category-performance", getCategoryPerformance);
router.get("/inventory-alerts", getInventoryAlerts);
router.get("/activities", getRecentActivities);

export default router;
