import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Cart } from "../models/Cart.js";

let mongod;
let customerToken;
let adminToken;
let customerId;
let adminId;
let testProduct;
let testCategory;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Create test category & product
  testCategory = await Category.create({ name: "Baby Rattles", slug: "baby-rattles", active: true });
  testProduct = await Product.create({
    name: "Wooden Rattle",
    slug: "wooden-rattle",
    sku: "SKU-RAT-1",
    description: "Natural beechwood rattle",
    brand: "Little Sprout",
    category: testCategory._id,
    ageRange: "0-6m",
    price: 15.0,
    stock: 25,
    inventoryStatus: "in_stock",
  });

  // Create customer
  const custRes = await request(app).post("/api/auth/register").send({
    name: "Alice Customer",
    email: "alice@example.com",
    password: "Password123",
  });
  customerToken = custRes.body.data.accessToken;
  customerId = custRes.body.data.user.id || custRes.body.data.user._id;

  // Create admin
  const passwordHash = await User.hashPassword("Password123");
  const adminUser = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    passwordHash,
    role: "admin",
  });
  adminId = adminUser._id;

  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "Password123",
  });
  adminToken = adminLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Payment Integration & Webhooks", () => {
  let createdOrder;

  beforeEach(async () => {
    // Add product to customer's cart
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: testProduct._id.toString(), quantity: 2 });

    // Create order
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        idempotencyKey: `idemp_${Date.now()}_${Math.random()}`,
        address: {
          fullName: "Alice Customer",
          phone: "1234567890",
          line1: "123 Main St",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          country: "US",
        },
        shippingMethod: "standard",
      });

    createdOrder = orderRes.body.data;
  });

  it("creates a PaymentIntent for a pending order", async () => {
    const res = await request(app)
      .post("/api/payments/create-intent")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: createdOrder._id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clientSecret).toBeDefined();
    expect(res.body.data.paymentIntentId).toBeDefined();
    expect(res.body.data.amount).toBe(createdOrder.pricing.total);
  });

  it("confirms sandbox payment and marks order as paid", async () => {
    const res = await request(app)
      .post("/api/payments/confirm-sandbox")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: createdOrder._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("paid");
    expect(res.body.data.payment.status).toBe("paid");

    // Verify in database
    const dbOrder = await Order.findById(createdOrder._id);
    expect(dbOrder.status).toBe("paid");
    expect(dbOrder.payment.status).toBe("paid");

    const paymentDoc = await Payment.findOne({ order: createdOrder._id });
    expect(paymentDoc.status).toBe("succeeded");
  });

  it("processes payment_intent.succeeded webhook payload", async () => {
    // Create a new order for webhook test
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: testProduct._id.toString(), quantity: 1 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        idempotencyKey: `idemp_webhook_${Date.now()}`,
        address: {
          fullName: "Alice Customer",
          line1: "123 Main St",
          city: "New York",
          postalCode: "10001",
          country: "US",
        },
      });

    const order = orderRes.body.data;

    const webhookPayload = {
      id: "evt_test_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_12345",
          metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
          },
        },
      },
    };

    const res = await request(app)
      .post("/api/payments/webhook")
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("paid");
  });

  it("handles payment failure and restores stock", async () => {
    const initialProduct = await Product.findById(testProduct._id);
    const initialStock = initialProduct.stock;

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: testProduct._id.toString(), quantity: 3 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        idempotencyKey: `idemp_fail_${Date.now()}`,
        address: { fullName: "Alice", line1: "123 St", city: "NY", postalCode: "10001", country: "US" },
      });

    const order = orderRes.body.data;

    // Stock should have decreased by 3
    const stockAfterOrder = (await Product.findById(testProduct._id)).stock;
    expect(stockAfterOrder).toBe(initialStock - 3);

    // Send payment_intent.payment_failed webhook
    const webhookPayload = {
      id: "evt_fail_123",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_test_failed",
          metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
          },
          last_payment_error: { message: "Card declined" },
        },
      },
    };

    await request(app).post("/api/payments/webhook").send(webhookPayload);

    const failedOrder = await Order.findById(order._id);
    expect(failedOrder.status).toBe("failed");

    // Stock should be restored
    const restoredProduct = await Product.findById(testProduct._id);
    expect(restoredProduct.stock).toBe(initialStock);
  });
});

describe("Admin Analytics", () => {
  it("denies access to non-admin customers", async () => {
    const res = await request(app)
      .get("/api/analytics/overview")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it("allows admin to view dashboard overview metrics", async () => {
    const res = await request(app)
      .get("/api/analytics/overview")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.revenue).toBeDefined();
    expect(res.body.data.revenue.total).toBeGreaterThanOrEqual(0);
    expect(res.body.data.orders).toBeDefined();
    expect(res.body.data.products).toBeDefined();
    expect(res.body.data.customers).toBeDefined();
  });

  it("returns sales trends data for charts", async () => {
    const res = await request(app)
      .get("/api/analytics/sales-trends?days=7")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);
    expect(res.body.data[0]).toHaveProperty("date");
    expect(res.body.data[0]).toHaveProperty("revenue");
    expect(res.body.data[0]).toHaveProperty("orders");
  });

  it("returns top selling products", async () => {
    const res = await request(app)
      .get("/api/analytics/top-products")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns category performance and inventory alerts", async () => {
    const catRes = await request(app)
      .get("/api/analytics/category-performance")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(catRes.status).toBe(200);

    const invRes = await request(app)
      .get("/api/analytics/inventory-alerts")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(invRes.status).toBe(200);
    expect(Array.isArray(invRes.body.data)).toBe(true);
  });
});
