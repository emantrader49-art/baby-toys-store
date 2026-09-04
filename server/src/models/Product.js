import mongoose from "mongoose";

export const AGE_RANGES = ["0-6m", "6-12m", "1-2y", "3-5y", "6-8y", "9y+"];

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    color: String,
    size: String,
    packQuantity: Number,
    model: String,
    price: Number, // overrides base price if set
    stock: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    altText: { type: String, default: "" },
    isThumbnail: { type: Boolean, default: false },
  },
  { _id: false }
);

const safetyInfoSchema = new mongoose.Schema(
  {
    material: String,
    chokingWarning: { type: Boolean, default: false },
    recommendedAge: String,
    certification: String,
    batteryInfo: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    ageRange: { type: String, enum: AGE_RANGES, required: true, index: true },
    price: { type: Number, required: true, min: 0, index: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    variants: [variantSchema],
    attributes: { type: Map, of: String, default: {} },
    safetyInfo: safetyInfoSchema,
    images: [imageSchema],
    stock: { type: Number, required: true, default: 0 },
    inventoryStatus: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock", "discontinued"],
      default: "in_stock",
    },
    lowStockThreshold: { type: Number, default: 5 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

// Text index for search across name/description/brand
productSchema.index({ name: "text", description: "text", brand: "text" });
// Compound indexes for common listing queries
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, "rating.average": -1 });
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });

productSchema.pre("save", function (next) {
  if (this.stock <= 0) this.inventoryStatus = "out_of_stock";
  else if (this.stock <= this.lowStockThreshold) this.inventoryStatus = "low_stock";
  else if (this.inventoryStatus !== "discontinued") this.inventoryStatus = "in_stock";
  next();
});

export const Product = mongoose.model("Product", productSchema);
