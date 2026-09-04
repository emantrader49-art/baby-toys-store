import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { AuditLog } from "../models/AuditLog.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ok } from "../utils/apiResponse.js";

const PAID_ORDER_STATUSES = ["paid", "processing", "packed", "shipped", "delivered"];

/**
 * GET /api/analytics/overview
 * Returns high-level KPIs: Total Revenue, Total Orders, Active Products, Low Stock, Total Customers.
 */
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    revenueAgg,
    prevRevenueAgg,
    orderStatusCounts,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCustomers,
    newCustomersThisMonth,
  ] = await Promise.all([
    // All-time & current 30-day revenue from paid orders
    Order.aggregate([
      { $match: { status: { $in: PAID_ORDER_STATUSES } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.total" },
          totalPaidOrders: { $sum: 1 },
          last30DaysRevenue: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, "$pricing.total", 0],
            },
          },
          last30DaysOrders: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 1, 0],
            },
          },
        },
      },
    ]),

    // Previous 30-day revenue (day 31 to 60 ago) for growth comparison
    Order.aggregate([
      {
        $match: {
          status: { $in: PAID_ORDER_STATUSES },
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
        },
      },
    ]),

    // Breakdown of all orders by status
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    // Product counts
    Product.countDocuments({ status: "active" }),
    Product.countDocuments({
      status: "active",
      $or: [{ inventoryStatus: "low_stock" }, { stock: { $gt: 0, $lte: 5 } }],
    }),
    Product.countDocuments({
      status: "active",
      $or: [{ inventoryStatus: "out_of_stock" }, { stock: { $lte: 0 } }],
    }),

    // Customer counts
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  const stats = revenueAgg[0] || {
    totalRevenue: 0,
    totalPaidOrders: 0,
    last30DaysRevenue: 0,
    last30DaysOrders: 0,
  };

  const prevStats = prevRevenueAgg[0] || { revenue: 0, orders: 0 };

  const revenueGrowth =
    prevStats.revenue > 0
      ? Math.round(((stats.last30DaysRevenue - prevStats.revenue) / prevStats.revenue) * 100)
      : stats.last30DaysRevenue > 0
      ? 100
      : 0;

  const ordersByStatus = {};
  let allOrdersCount = 0;
  orderStatusCounts.forEach((item) => {
    ordersByStatus[item._id] = item.count;
    allOrdersCount += item.count;
  });

  const aov = stats.totalPaidOrders > 0 ? Math.round((stats.totalRevenue / stats.totalPaidOrders) * 100) / 100 : 0;

  return ok(res, {
    revenue: {
      total: Math.round(stats.totalRevenue * 100) / 100,
      last30Days: Math.round(stats.last30DaysRevenue * 100) / 100,
      growthPercent: revenueGrowth,
      averageOrderValue: aov,
    },
    orders: {
      total: allOrdersCount,
      paid: stats.totalPaidOrders,
      last30Days: stats.last30DaysOrders,
      byStatus: ordersByStatus,
    },
    products: {
      total: totalProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
    },
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomersThisMonth,
    },
  });
});

/**
 * GET /api/analytics/sales-trends
 * Returns daily revenue and order counts over the requested timeframe (default 30 days).
 */
export const getSalesTrends = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, parseInt(req.query.days) || 30));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trends = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: PAID_ORDER_STATUSES },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$pricing.total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in missing dates with zeros for a smooth continuous chart
  const dateMap = new Map(trends.map((t) => [t._id, { revenue: Math.round(t.revenue * 100) / 100, orders: t.orders }]));
  const result = [];
  const curr = new Date(startDate);
  const today = new Date();

  while (curr <= today) {
    const key = curr.toISOString().split("T")[0];
    const existing = dateMap.get(key) || { revenue: 0, orders: 0 };
    result.push({
      date: key,
      revenue: existing.revenue,
      orders: existing.orders,
    });
    curr.setDate(curr.getDate() + 1);
  }

  return ok(res, result);
});

/**
 * GET /api/analytics/top-products
 * Aggregates bestselling products by quantity sold and total revenue.
 */
export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));

  const top = await Order.aggregate([
    { $match: { status: { $in: PAID_ORDER_STATUSES } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        sku: { $first: "$items.sku" },
        image: { $first: "$items.image" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);

  // Format revenue to 2 decimal places
  const formatted = top.map((item) => ({
    productId: item._id,
    name: item.name || "Product",
    sku: item.sku,
    image: item.image,
    unitsSold: item.unitsSold,
    revenue: Math.round(item.revenue * 100) / 100,
  }));

  return ok(res, formatted);
});

/**
 * GET /api/analytics/category-performance
 * Returns revenue and units sold grouped by category.
 */
export const getCategoryPerformance = asyncHandler(async (req, res) => {
  const performance = await Order.aggregate([
    { $match: { status: { $in: PAID_ORDER_STATUSES } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: "$productDoc" },
    {
      $lookup: {
        from: "categories",
        localField: "productDoc.category",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$categoryDoc.name",
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const formatted = performance.map((c) => ({
    category: c._id || "Uncategorized",
    unitsSold: c.unitsSold,
    revenue: Math.round(c.revenue * 100) / 100,
  }));

  return ok(res, formatted);
});

/**
 * GET /api/analytics/inventory-alerts
 * Returns low stock and out of stock products.
 */
export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    status: "active",
    $or: [{ inventoryStatus: { $in: ["low_stock", "out_of_stock"] } }, { stock: { $lte: 5 } }],
  })
    .select("name sku price stock lowStockThreshold inventoryStatus images")
    .populate("category", "name")
    .sort({ stock: 1 })
    .limit(50);

  return ok(res, products);
});

/**
 * GET /api/analytics/activities
 * Returns recent audit logs and recent orders.
 */
export const getRecentActivities = asyncHandler(async (req, res) => {
  const [logs, recentOrders] = await Promise.all([
    AuditLog.find().populate("actor", "name email role").sort({ createdAt: -1 }).limit(15),
    Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(10),
  ]);

  return ok(res, { logs, recentOrders });
});
