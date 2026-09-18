// Repeatable seed script: wipes and recreates demo data.
// Run with: npm run seed --prefix server
import { connectDB } from "../config/db.js";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import slugify from "./slugify.js";

const CATEGORY_NAMES = [
  "Rattles",
  "Learning Toys",
  "Pretend Play",
  "Building Blocks",
  "Dolls",
  "Remote Control",
  "Outdoor",
  "STEM",
  "Montessori",
  "Newborn Essentials",
];

const BRANDS = ["Fisher-Price", "LeapFrog", "Melissa & Doug"];
const AGE_RANGES = ["0-6m", "6-12m", "1-2y", "3-5y", "6-8y", "9y+"];

async function seed() {
  await connectDB();
  console.log("[seed] Connected. Wiping existing demo data...");

  // Synchronize/drop outdated collection indexes to ensure clean schema state
  try {
    await Product.collection.dropIndexes();
  } catch {
    // collection might not exist yet
  }
  await Product.syncIndexes();

  await Promise.all([
    User.deleteMany({ email: { $in: ["customer@demo.com", "staff@demo.com", "admin@demo.com"] } }),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  // Demo users
  const passwordHash = await User.hashPassword("Password123");
  await User.create([
    { name: "Demo Customer", email: "customer@demo.com", passwordHash, role: "customer" },
    { name: "Demo Staff", email: "staff@demo.com", passwordHash, role: "staff" },
    { name: "Demo Admin", email: "admin@demo.com", passwordHash, role: "admin" },
  ]);
  console.log("[seed] Created demo accounts (password: Password123)");

  // Categories
  const categories = await Category.insertMany(
    CATEGORY_NAMES.map((name) => ({ name, slug: slugify(name), active: true }))
  );
  console.log(`[seed] Created ${categories.length} categories`);

  // 40+ products, spread across categories/brands/age ranges
  const products = [];
  for (let i = 1; i <= 42; i++) {
    const category = categories[i % categories.length];
    const brand = BRANDS[i % BRANDS.length];
    const ageRange = AGE_RANGES[i % AGE_RANGES.length];
    const name = `${category.name} Toy ${i} by ${brand}`;

    // Optionally include variants on every 3rd product
    const hasVariants = i % 3 === 0;
    const variants = hasVariants
      ? [
          { sku: `SKU-${1000 + i}-BLU`, color: "Pastel Blue", stock: 10 },
          { sku: `SKU-${1000 + i}-SGE`, color: "Sage Green", stock: 12 },
          { sku: `SKU-${1000 + i}-PCH`, color: "Warm Peach", stock: 8 },
        ]
      : [];

    products.push({
      name,
      slug: slugify(`${name}-${i}`),
      sku: `SKU-${1000 + i}`,
      description: `A fun and safe ${category.name.toLowerCase()} toy designed for children in the ${ageRange} age range. Made with quality materials and rigorously safety tested.`,
      brand,
      category: category._id,
      ageRange,
      price: Math.round((10 + (i % 15) * 3.5) * 100) / 100,
      discountPercent: i % 5 === 0 ? 15 : 0,
      stock: hasVariants ? 30 : 20 + (i % 10),
      variants,
      images: [{ url: `https://loremflickr.com/500/500/${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, ","))},toy,baby?lock=${1000 + i}`, altText: name, isThumbnail: true }],images: [{ url: `https://placehold.co/500x500/e8dcc8/3d2f1f?text=${encodeURIComponent(name)}`, altText: name, isThumbnail: true }],
      safetyInfo: {
        material: "BPA-free plastic",
        chokingWarning: ageRange === "0-6m" || ageRange === "6-12m",
        recommendedAge: ageRange,
        certification: "ASTM F963",
        batteryInfo: i % 4 === 0 ? "2x AA batteries required (included)" : "No batteries required",
      },
      rating: { average: 3.5 + (i % 3) * 0.5, count: 5 + i, distribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 8 } },
    });
  }
  await Product.insertMany(products);
  console.log(`[seed] Created ${products.length} products`);

  // Coupons
  await Coupon.insertMany([
    { code: "WELCOME10", type: "percent", value: 10, minimumOrder: 20, usageLimit: 500, perUserLimit: 1, active: true },
    { code: "SAVE5", type: "fixed", value: 5, minimumOrder: 15, usageLimit: 1000, perUserLimit: 2, active: true },
  ]);
  console.log("[seed] Created demo coupons: WELCOME10, SAVE5");

  console.log("[seed] Done.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
