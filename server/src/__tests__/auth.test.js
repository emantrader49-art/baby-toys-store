import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Auth flow", () => {
  const user = { name: "Test User", email: "test@example.com", password: "Password123" };

  it("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(user);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app).post("/api/auth/register").send(user);
    expect(res.status).toBe(409);
  });

  it("rejects weak passwords", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Weak", email: "weak@example.com", password: "abc" });
    expect(res.status).toBe(422);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: user.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "WrongPassword1",
    });
    expect(res.status).toBe(401);
  });

  it("blocks access to a protected admin-only route without a token", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Test Category" });
    expect(res.status).toBe(401);
  });

  it("blocks a customer-role token from admin-only category creation", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: user.password,
    });
    const token = login.body.data.accessToken;

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Category" });
    expect(res.status).toBe(403);
  });
});
