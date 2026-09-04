import slugify from "../utils/slugify.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { recordAuditLog } from "../services/auditLog.service.js";

// GET /api/products — server-side search, filter, sort, pagination.
// Never loads the full catalog to the browser.
export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, ageRange, brand, minPrice, maxPrice, minRating, inStock, sort } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 20));

  const filter = { status: "active" };
  if (category) filter.category = category;
  if (ageRange) filter.ageRange = ageRange;
  if (brand) filter.brand = brand;
  if (inStock === "true") filter.inventoryStatus = { $in: ["in_stock", "low_stock"] };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minRating) filter["rating.average"] = { $gte: Number(minRating) };
  if (q) filter.$text = { $search: q };

  let sortSpec = { createdAt: -1 };
  if (sort === "price_asc") sortSpec = { price: 1 };
  else if (sort === "price_desc") sortSpec = { price: -1 };
  else if (sort === "rating") sortSpec = { "rating.average": -1 };
  else if (sort === "popularity") sortSpec = { "rating.count": -1 };
  else if (sort === "relevance" && q) sortSpec = { score: { $meta: "textScore" } };
  else if (sort === "newest") sortSpec = { createdAt: -1 };

  const projection = q && sort === "relevance" ? { score: { $meta: "textScore" } } : undefined;

  const [items, total] = await Promise.all([
    Product.find(filter, projection)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug"),
    Product.countDocuments(filter),
  ]);

  return ok(res, items, {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "active" }).populate(
    "category",
    "name slug"
  );
  if (!product) throw new AppError("Product not found", 404);
  return ok(res, product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const product = await Product.create({ ...req.body, slug });
  await recordAuditLog({ req, action: "product.create", entity: "Product", entityId: product._id, after: product });
  return created(res, product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const before = await Product.findById(req.params.id);
  if (!before) throw new AppError("Product not found", 404);

  const updates = { ...req.body };
  if (updates.name) updates.slug = slugify(updates.name);

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  await recordAuditLog({
    req,
    action: "product.update",
    entity: "Product",
    entityId: product._id,
    before,
    after: product,
  });
  return ok(res, product);
});

// Soft-delete / archive rather than a careless permanent delete.
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
  if (!product) throw new AppError("Product not found", 404);
  await recordAuditLog({ req, action: "product.archive", entity: "Product", entityId: product._id });
  return ok(res, { message: "Product archived" });
});
