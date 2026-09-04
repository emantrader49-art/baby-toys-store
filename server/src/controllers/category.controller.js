import slugify from "../utils/slugify.js";
import { Category } from "../models/Category.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { recordAuditLog } from "../services/auditLog.service.js";

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ active: true }).sort({ name: 1 });
  return ok(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const category = await Category.create({ ...req.body, slug });
  await recordAuditLog({ req, action: "category.create", entity: "Category", entityId: category._id, after: category });
  return created(res, category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const before = await Category.findById(req.params.id);
  if (!before) throw new AppError("Category not found", 404);
  const updates = { ...req.body };
  if (updates.name) updates.slug = slugify(updates.name);
  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  await recordAuditLog({ req, action: "category.update", entity: "Category", entityId: category._id, before, after: category });
  return ok(res, category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) throw new AppError("Category not found", 404);
  await recordAuditLog({ req, action: "category.deactivate", entity: "Category", entityId: category._id });
  return ok(res, { message: "Category deactivated" });
});
