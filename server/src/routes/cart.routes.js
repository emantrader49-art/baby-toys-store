import { Router } from "express";
import { getCart, addItem, updateItem, removeItem, clearCart, mergeGuestCart } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate); // cart requires a logged-in user (guest cart lives in frontend state only)

router.get("/", getCart);
router.post("/items", addItem);
router.post("/merge", mergeGuestCart);
router.patch("/items/:itemId", updateItem);
router.delete("/items/:itemId", removeItem);
router.delete("/", clearCart);

export default router;
