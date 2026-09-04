export default function StatusBadge({ status, type = "order" }) {
  if (type === "stock") {
    switch (status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span> In Stock
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span> Low Stock
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span> Out of Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  }

  // Order status badges
  const orderStyles = {
    pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-purple-50 text-purple-700 border-purple-200",
    packed: "bg-indigo-50 text-indigo-700 border-indigo-200",
    shipped: "bg-teal-50 text-teal-700 border-teal-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
    cancel_requested: "bg-orange-50 text-orange-700 border-orange-200",
    return_requested: "bg-orange-50 text-orange-700 border-orange-200",
    returned: "bg-gray-100 text-gray-600 border-gray-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const label = (status || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        orderStyles[status] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {label}
    </span>
  );
}
