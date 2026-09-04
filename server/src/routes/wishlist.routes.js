import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
