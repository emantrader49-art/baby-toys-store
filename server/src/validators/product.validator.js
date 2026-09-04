import { z } from "zod";
import { AGE_RANGES } from "../models/Product.js";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    sku: z.string().min(1),
    description: z.string().min(10),
    brand: z.string().min(1),
    category: z.string().min(1), // ObjectId string
    ageRange: z.enum(AGE_RANGES),
    price: z.number().positive(),
    discountPercent: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0),
    images: z
      .array(z.object({ url: z.string().url(), altText: z.string().optional(), isThumbnail: z.boolean().optional() }))
      .optional(),
    safetyInfo: z
      .object({
        material: z.string().optional(),
        chokingWarning: z.boolean().optional(),
        recommendedAge: z.string().optional(),
        certification: z.string().optional(),
        batteryInfo: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
  params: z.object({ id: z.string().min(1) }),
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    ageRange: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    minRating: z.string().optional(),
    inStock: z.string().optional(),
    sort: z.enum(["relevance", "newest", "price_asc", "price_desc", "rating", "popularity"]).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
