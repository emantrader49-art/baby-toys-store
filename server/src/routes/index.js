import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import cartRoutes from "./cart.routes.js";
import orderRoutes from "./order.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import reviewRoutes from "./review.routes.js"; // mounts its own full paths below
import paymentRoutes from "./payment.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/payments", paymentRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/", reviewRoutes); // review.routes.js defines /products/:id/reviews and /reviews/:id itself

export default router;
