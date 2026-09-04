import { Router } from "express";
import {
  listProductReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReview,
} from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Mounted at /api — routes below are full paths (not nested under /products or /reviews)
router.get("/products/:id/reviews", listProductReviews);
router.post("/products/:id/reviews", authenticate, createReview);
router.patch("/reviews/:id", authenticate, updateReview);
router.delete("/reviews/:id", authenticate, deleteReview);
router.patch("/reviews/:id/moderate", authenticate, authorize("staff", "admin"), moderateReview);

export default router;
