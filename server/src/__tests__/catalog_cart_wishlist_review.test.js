import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";

let mongod;
let customerToken;
let secondCustomerToken;
let adminToken;
let productA;
let productB;
let testCategory;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  testCategory = await Category.create({ name: "STEM Toys", slug: "stem-toys", active: true });

  productA = await Product.create({
    name: "Building Blocks Set",
    slug: "building-blocks-set",
    sku: "SKU-BLK-1",
    description: "Colorful wooden building blocks",
    brand: "Little Sprout",
    category: testCategory._id,
    ageRange: "1-2y",
    price: 25.0,
    stock: 40,
    inventoryStatus: "in_stock",
    status: "active",
  });

  productB = await Product.create({
    name: "Musical Rattle",
    slug: "musical-rattle",
    sku: "SKU-RAT-2",
    description: "A gentle musical rattle for infants",
    brand: "Fisher-Price",
    category: testCategory._id,
    ageRange: "0-6m",
    price: 60.0,
    stock: 5,
    inventoryStatus: "low_stock",
    status: "active",
  });

  const custRes = await request(app).post("/api/auth/register").send({
    name: "Bob Customer",
    email: "bob@example.com",
    password: "Password123",
  });
  customerToken = custRes.body.data.accessToken;

  const secondRes = await request(app).post("/api/auth/register").send({
    name: "Carol Customer",
    email: "carol@example.com",
    password: "Password123",
  });
  secondCustomerToken = secondRes.body.data.accessToken;

  const passwordHash = await User.hashPassword("Password123");
  await User.create({
    name: "Admin Two",
    email: "admin2@example.com",
    passwordHash,
    role: "admin",
  });
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin2@example.com",
    password: "Password123",
  });
  adminToken = adminLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Product catalog: search, filter, sort, pagination", () => {
  it("lists products with pagination metadata", async () => {
    const res = await request(app).get("/api/products?page=1&limit=1");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(1);
  });

  it("filters products by price range", async () => {
    const res = await request(app).get("/api/products?minPrice=50&maxPrice=100");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.price >= 50 && p.price <= 100)).toBe(true);
  });

  it("filters products by age range", async () => {
    const res = await request(app).get("/api/products?ageRange=0-6m");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.ageRange === "0-6m")).toBe(true);
  });

  it("returns a single product by slug", async () => {
    const res = await request(app).get(`/api/products/${productA.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Building Blocks Set");
  });

  it("returns 404 for a non-existent product slug", async () => {
    const res = await request(app).get("/api/products/does-not-exist-slug");
    expect(res.status).toBe(404);
  });

  it("blocks a customer from creating a product (admin/staff only)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Hack Toy", price: 10 });
    expect(res.status).toBe(403);
  });

  it("allows an admin to create a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Admin Created Toy",
        sku: "SKU-ADM-1",
        description: "Created via admin API test",
        brand: "Little Sprout",
        category: testCategory._id.toString(),
        ageRange: "3-5y",
        price: 18.5,
        stock: 12,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBeDefined();
  });
});

describe("Cart operations", () => {
  it("rejects cart access without authentication", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("adds an item to the cart", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productA._id.toString(), quantity: 2 });
    expect(res.status).toBe(200);
    const item = res.body.data.items.find((i) => i.product._id === productA._id.toString());
    expect(item.quantity).toBe(2);
  });

  it("rejects adding a quantity greater than available stock", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productB._id.toString(), quantity: 999 });
    expect(res.status).toBe(400);
  });

  it("updates the quantity of an existing cart item", async () => {
    const cartRes = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);
    const item = cartRes.body.data.items[0];

    const res = await request(app)
      .patch(`/api/cart/items/${item._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
    const updated = res.body.data.items.find((i) => i._id === item._id);
    expect(updated.quantity).toBe(3);
  });

  it("removes an item from the cart", async () => {
    const cartRes = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);
    const item = cartRes.body.data.items[0];

    const res = await request(app)
      .delete(`/api/cart/items/${item._id}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.find((i) => i._id === item._id)).toBeUndefined();
  });
});

describe("Wishlist", () => {
  it("rejects wishlist access without authentication", async () => {
    const res = await request(app).get("/api/wishlist");
    expect(res.status).toBe(401);
  });

  it("adds a product to the wishlist", async () => {
    const res = await request(app)
      .post(`/api/wishlist/${productA._id}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(
      res.body.data.products.some((p) => (p._id || p).toString() === productA._id.toString())
    ).toBe(true);
  });

  it("removes a product from the wishlist", async () => {
    const res = await request(app)
      .delete(`/api/wishlist/${productA._id}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(
      res.body.data.products.some((p) => (p._id || p).toString() === productA._id.toString())
    ).toBe(false);
  });
});

describe("Reviews", () => {
  it("rejects an unauthenticated review submission", async () => {
    const res = await request(app)
      .post(`/api/products/${productA._id}/reviews`)
      .send({ rating: 5, title: "Great", comment: "Loved it" });
    expect(res.status).toBe(401);
  });

  it("allows an authenticated customer to submit a review", async () => {
    const res = await request(app)
      .post(`/api/products/${productA._id}/reviews`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 5, title: "Great toy", comment: "My baby loves it" });
    expect(res.status).toBe(201);
    expect(res.body.data.moderationStatus).toBe("pending");
    expect(res.body.data.verifiedPurchase).toBe(false);
  });

  it("prevents a second review from the same user on the same product", async () => {
    const res = await request(app)
      .post(`/api/products/${productA._id}/reviews`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4, title: "Again", comment: "Still good" });
    expect(res.status).toBe(409);
  });

  it("prevents editing another user's review", async () => {
    const ownReview = await request(app)
      .post(`/api/products/${productB._id}/reviews`)
      .set("Authorization", `Bearer ${secondCustomerToken}`)
      .send({ rating: 3, title: "Okay", comment: "It is fine" });

    const res = await request(app)
      .patch(`/api/reviews/${ownReview.body.data._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 1, title: "Hacked", comment: "Not mine" });
    expect(res.status).toBe(403);
  });

  it("allows staff/admin to moderate (approve) a review", async () => {
    const created = await request(app)
      .post(`/api/products/${productB._id}/reviews`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 5, title: "Second product review", comment: "Nice" });

    const res = await request(app)
      .patch(`/api/reviews/${created.body.data._id}/moderate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.data.moderationStatus).toBe("approved");
  });
});
