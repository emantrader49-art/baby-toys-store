import { Router } from "express";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listCategories);
router.post("/", authenticate, authorize("staff", "admin"), createCategory);
router.patch("/:id", authenticate, authorize("staff", "admin"), updateCategory);
router.delete("/:id", authenticate, authorize("admin"), deleteCategory);

export default router;
