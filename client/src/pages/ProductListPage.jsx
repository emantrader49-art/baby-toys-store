import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "../services/apiClient.js";

export default function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/products", { params: Object.fromEntries(params) })
      .then(({ data }) => {
        setProducts(data.data);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setParams(next);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-ink">Shop all toys</h1>
        <div className="flex gap-2">
          <input
            placeholder="Search toys…"
            defaultValue={params.get("q") || ""}
            onChange={(e) => updateParam("q", e.target.value)}
            className="rounded-soft border border-sage-100 px-3 py-2 text-sm"
          />
          <select
            defaultValue={params.get("sort") || ""}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-soft border border-sage-100 px-3 py-2 text-sm"
          >
            <option value="">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-soft bg-sage-50 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-ink/60">No toys matched your search. Try different filters.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p._id}
              to={`/products/${p.slug}`}
              className="rounded-soft bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <img src={p.images?.[0]?.url} alt={p.images?.[0]?.altText || p.name} className="w-full h-40 object-cover" />
              <div className="p-3">
                <h3 className="text-sm font-medium text-ink line-clamp-2">{p.name}</h3>
                <p className="text-sage-700 font-semibold mt-1">${p.price.toFixed(2)}</p>
                <p className="text-xs text-ink/50 mt-1">{p.rating?.average?.toFixed(1)} ★ ({p.rating?.count})</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParam("page", String(p))}
              className={`w-8 h-8 rounded-soft text-sm ${
                meta.page === p ? "bg-sage-600 text-white" : "bg-white text-ink border border-sage-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
