import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchDashboardOverview,
  fetchSalesTrends,
  fetchTopProducts,
  fetchCategoryPerformance,
  fetchInventoryAlerts,
  fetchRecentActivities,
} from "../features/analytics/analyticsSlice.js";
import { fetchAllOrders, updateOrderStatus } from "../features/orders/ordersSlice.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Toast from "../components/Toast.jsx";

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const {
    overview,
    salesTrends,
    topProducts,
    categoryPerformance,
    inventoryAlerts,
    recentActivities,
    status: analyticsStatus,
  } = useSelector((s) => s.analytics);
  const { adminOrders, adminMeta } = useSelector((s) => s.orders);

  const [timeRange, setTimeRange] = useState(30);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "orders" | "inventory" | "audit"
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    if (!user || !["admin", "staff"].includes(user.role)) {
      navigate("/login?redirect=/admin");
      return;
    }
    dispatch(fetchDashboardOverview());
    dispatch(fetchSalesTrends(timeRange));
    dispatch(fetchTopProducts(5));
    dispatch(fetchCategoryPerformance());
    dispatch(fetchInventoryAlerts());
    dispatch(fetchRecentActivities());
    dispatch(fetchAllOrders());
  }, [dispatch, user, navigate, timeRange]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await dispatch(
        updateOrderStatus({
          orderId,
          status: newStatus,
          note: `Admin status update to ${newStatus}`,
        })
      ).unwrap();
      dispatch(fetchDashboardOverview());
      setToastMessage(`Order status updated to "${newStatus}"!`);
      setToastType("success");
    } catch (err) {
      setToastMessage(err || "Failed to update order status");
      setToastType("error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!user || !["admin", "staff"].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-rose-600 mb-2">Access Denied</h1>
        <p className="text-xs text-ink/60 mb-6">You must be logged in as an administrator to view this page.</p>
        <Link to="/login" className="px-4 py-2 rounded-soft bg-sage-600 text-white text-xs font-semibold">
          Log In as Admin
        </Link>
      </div>
    );
  }

  // Calculate maximum daily revenue for SVG chart scaling
  const maxRevenue = Math.max(...(salesTrends.map((d) => d.revenue) || [100]), 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-sage-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="font-display text-2xl font-bold text-ink">Admin Analytics & Store Operations</h1>
          </div>
          <p className="text-xs text-ink/60 mt-1">Real-time telemetry, revenue analytics, inventory health, and order fulfillment.</p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink/60">Timeframe:</span>
          <div className="flex bg-white rounded-soft border border-sage-100 p-0.5 text-xs">
            {[
              { label: "7 Days", val: 7 },
              { label: "30 Days", val: 30 },
              { label: "90 Days", val: 90 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setTimeRange(t.val)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  timeRange === t.val ? "bg-sage-600 text-white shadow-xs" : "text-ink/60 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-4 border-b border-sage-200 mb-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "overview" ? "border-sage-600 text-sage-700" : "border-transparent text-ink/60 hover:text-ink"
          }`}
        >
          📈 Analytics Overview
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "orders" ? "border-sage-600 text-sage-700" : "border-transparent text-ink/60 hover:text-ink"
          }`}
        >
          📦 Orders & Fulfillment ({adminOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "inventory" ? "border-sage-600 text-sage-700" : "border-transparent text-ink/60 hover:text-ink"
          }`}
        >
          ⚠️ Inventory Alerts ({inventoryAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "audit" ? "border-sage-600 text-sage-700" : "border-transparent text-ink/60 hover:text-ink"
          }`}
        >
          🛡️ Audit Logs
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* 4 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Revenue */}
            <div className="bg-white rounded-soft border border-sage-100 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider block">Total Revenue</span>
                  <div className="text-2xl font-bold font-display text-sage-700 mt-1">
                    ${overview?.revenue?.total?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <span className="p-2 bg-sage-50 text-sage-700 rounded-soft text-lg">💰</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sage-50 text-xs text-ink/60">
                <span className="text-emerald-700 font-bold">+{overview?.revenue?.growthPercent || 0}%</span>
                <span>last 30 days (${overview?.revenue?.last30Days?.toFixed(2) || 0})</span>
              </div>
            </div>

            {/* Card 2: Orders */}
            <div className="bg-white rounded-soft border border-sage-100 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider block">Completed Orders</span>
                  <div className="text-2xl font-bold font-display text-ink mt-1">
                    {overview?.orders?.paid || 0} <span className="text-xs text-ink/40 font-normal">/ {overview?.orders?.total || 0} total</span>
                  </div>
                </div>
                <span className="p-2 bg-blue-50 text-blue-700 rounded-soft text-lg">📦</span>
              </div>
              <div className="mt-3 pt-3 border-t border-sage-50 text-xs text-ink/60">
                <span>Avg Order Value: <strong>${overview?.revenue?.averageOrderValue?.toFixed(2) || 0}</strong></span>
              </div>
            </div>

            {/* Card 3: Products */}
            <div className="bg-white rounded-soft border border-sage-100 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider block">Toy Catalog</span>
                  <div className="text-2xl font-bold font-display text-ink mt-1">
                    {overview?.products?.total || 0} Active
                  </div>
                </div>
                <span className="p-2 bg-apricot-100 text-apricot-500 rounded-soft text-lg">🧸</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sage-50 text-xs">
                {overview?.products?.lowStock > 0 ? (
                  <span className="text-amber-700 font-bold">⚠️ {overview.products.lowStock} Low Stock</span>
                ) : (
                  <span className="text-emerald-700 font-bold">✓ Stock Healthy</span>
                )}
              </div>
            </div>

            {/* Card 4: Customers */}
            <div className="bg-white rounded-soft border border-sage-100 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider block">Total Customers</span>
                  <div className="text-2xl font-bold font-display text-ink mt-1">
                    {overview?.customers?.total || 0}
                  </div>
                </div>
                <span className="p-2 bg-purple-50 text-purple-700 rounded-soft text-lg">👥</span>
              </div>
              <div className="mt-3 pt-3 border-t border-sage-50 text-xs text-ink/60">
                <span className="text-emerald-700 font-bold">+{overview?.customers?.newThisMonth || 0}</span> new this month
              </div>
            </div>
          </div>

          {/* REVENUE TRENDS VISUAL CHART */}
          <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-base text-ink">Daily Revenue & Sales Volume ({timeRange} Days)</h3>
                <p className="text-xs text-ink/50">Continuous daily tracking of processed store sales</p>
              </div>
              <span className="text-xs font-bold text-sage-700 bg-sage-50 px-3 py-1 rounded-full border border-sage-200">
                Peak: ${maxRevenue.toFixed(2)}
              </span>
            </div>

            {salesTrends.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-ink/40">No sales data in this window</div>
            ) : (
              <div className="space-y-2">
                <div className="h-48 flex items-end gap-1.5 pt-4 border-b border-sage-100">
                  {salesTrends.map((day, idx) => {
                    const heightPct = Math.max(8, Math.round((day.revenue / maxRevenue) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 bg-ink text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                          <p className="font-bold">${day.revenue.toFixed(2)}</p>
                          <p className="text-gray-300">{day.orders} orders ({day.date})</p>
                        </div>

                        {/* Bar */}
                        <div
                          className={`w-full rounded-t transition-all ${
                            day.revenue > 0 ? "bg-sage-600 group-hover:bg-sage-700" : "bg-sage-100"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-ink/40 pt-1">
                  <span>{salesTrends[0]?.date}</span>
                  <span>{salesTrends[Math.floor(salesTrends.length / 2)]?.date}</span>
                  <span>{salesTrends[salesTrends.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* TWO COLUMNS: Top Products & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-ink pb-2 border-b border-sage-100 flex items-center justify-between">
                <span>🏆 Top Selling Toys</span>
                <span className="text-xs text-ink/40 font-normal">By units sold</span>
              </h3>

              {topProducts.length === 0 ? (
                <p className="text-xs text-ink/50 italic py-4">No completed toy sales yet.</p>
              ) : (
                <div className="divide-y divide-sage-50 text-xs">
                  {topProducts.map((p, idx) => (
                    <div key={p.productId || idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-sage-50 font-bold text-[11px] text-sage-700 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-ink truncate max-w-xs">{p.name}</p>
                          <p className="text-ink/40 text-[10px]">SKU: {p.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-ink block">{p.unitsSold} sold</span>
                        <span className="text-[11px] text-sage-700">${p.revenue?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-ink pb-2 border-b border-sage-100">
                🎯 Category Revenue Breakdown
              </h3>

              {categoryPerformance.length === 0 ? (
                <p className="text-xs text-ink/50 italic py-4">No category sales recorded yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {categoryPerformance.map((c, idx) => {
                    const totalCatRev = categoryPerformance.reduce((s, i) => s + (i.revenue || 0), 0) || 1;
                    const pct = Math.round(((c.revenue || 0) / totalCatRev) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-semibold text-ink">
                          <span>{c.category}</span>
                          <span>${c.revenue?.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-sage-50 overflow-hidden">
                          <div className="h-full bg-sage-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-soft border border-sage-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-sage-100 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-ink">Fulfillment & Order Transition Manager</h3>
            <span className="text-xs text-ink/50">{adminOrders.length} orders recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50 text-ink/70 font-semibold border-b border-sage-100">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3">Allowed Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {adminOrders.map((order) => {
                  const allowedTransitions = {
                    pending_payment: ["paid", "failed"],
                    paid: ["processing"],
                    processing: ["packed", "cancel_requested"],
                    packed: ["shipped"],
                    shipped: ["delivered"],
                    delivered: ["return_requested"],
                    cancel_requested: ["cancelled"],
                    return_requested: ["returned", "rejected"],
                  }[order.status] || [];

                  return (
                    <tr key={order._id} className="hover:bg-sage-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-ink">{order.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-ink">{order.user?.name || "Guest"}</p>
                        <p className="text-ink/40 text-[10px]">{order.user?.email}</p>
                      </td>
                      <td className="p-3 text-ink/70">{order.items?.length || 0} line items</td>
                      <td className="p-3 font-bold text-sage-700">${order.pricing?.total?.toFixed(2)}</td>
                      <td className="p-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-3">
                        {allowedTransitions.length > 0 ? (
                          <div className="flex gap-2">
                            {allowedTransitions.map((nextStatus) => (
                              <button
                                key={nextStatus}
                                disabled={updatingOrderId === order._id}
                                onClick={() => handleStatusChange(order._id, nextStatus)}
                                className="px-2.5 py-1 rounded bg-sage-600 text-white font-semibold text-[11px] hover:bg-sage-700 transition-colors disabled:opacity-50 uppercase"
                              >
                                → {nextStatus}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink/40 italic">Terminal state</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY ALERTS */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-soft border border-sage-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-sage-100">
            <div>
              <h3 className="font-semibold text-sm text-ink">Low Stock & Out-of-Stock Alerts</h3>
              <p className="text-xs text-ink/50">Toys requiring restock procurement</p>
            </div>
          </div>

          {inventoryAlerts.length === 0 ? (
            <div className="text-center py-8 text-xs text-emerald-700 font-semibold">
              ✓ All products are healthy and above minimum safety thresholds.
            </div>
          ) : (
            <div className="divide-y divide-sage-100 text-xs">
              {inventoryAlerts.map((prod) => (
                <div key={prod._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images?.[0]?.url || "https://via.placeholder.com/50"}
                      alt=""
                      className="w-10 h-10 object-contain rounded border border-sage-100"
                    />
                    <div>
                      <p className="font-semibold text-ink">{prod.name}</p>
                      <p className="text-ink/40 text-[10px]">SKU: {prod.sku} • Category: {prod.category?.name || "Toys"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Stock: {prod.stock} units left
                    </span>
                    <StatusBadge status={prod.inventoryStatus} type="stock" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-soft border border-sage-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-sm text-ink pb-3 border-b border-sage-100">
            System & Security Audit Log
          </h3>

          <div className="divide-y divide-sage-100 text-xs">
            {recentActivities?.logs?.map((log) => (
              <div key={log._id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink uppercase text-[11px] bg-sage-50 px-2 py-0.5 rounded text-sage-700">
                      {log.action}
                    </span>
                    <span className="text-ink/50 text-[11px]">
                      on {log.entity} ({log.entityId})
                    </span>
                  </div>
                  <p className="text-ink/60 text-[11px] mt-1">
                    Actor: {log.actor?.name || log.actor?.email || "System/Webhook"} • IP: {log.ip || "internal"}
                  </p>
                </div>
                <span className="text-ink/40 text-[10px]">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
