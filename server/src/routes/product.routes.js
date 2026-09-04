import { Router } from "express";
import {
  listProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from "../validators/product.validator.js";

const router = Router();

router.get("/", validate(listProductsQuerySchema), listProducts);
router.get("/:slug", getProductBySlug);

router.post("/", authenticate, authorize("staff", "admin"), validate(createProductSchema), createProduct);
router.patch("/:id", authenticate, authorize("staff", "admin"), validate(updateProductSchema), updateProduct);
router.delete("/:id", authenticate, authorize("staff", "admin"), deleteProduct);

export default router;
