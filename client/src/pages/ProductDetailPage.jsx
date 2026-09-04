import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductBySlug,
  fetchProductReviews,
  submitReview,
  clearCurrentProduct,
} from "../features/products/productsSlice.js";
import { addToCart } from "../features/cart/cartSlice.js";
import { addToWishlist, removeFromWishlist } from "../features/wishlist/wishlistSlice.js";
import StarRating from "../components/StarRating.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Toast from "../components/Toast.jsx";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentProduct: product, productStatus, reviews } = useSelector((s) => s.products);
  const user = useSelector((s) => s.auth.user);
  const wishlistItems = useSelector((s) => s.wishlist.items || []);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, slug]);

  useEffect(() => {
    if (product?._id) {
      dispatch(fetchProductReviews(product._id));
      if (product.variants?.length > 0) {
        setSelectedVariant(product.variants[0]);
      }
      setSelectedImage(0);
      setQuantity(1);
    }
  }, [dispatch, product]);

  if (productStatus === "loading" || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 rounded-soft bg-sage-50 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-sage-50 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-sage-50 rounded w-1/4 animate-pulse" />
            <div className="h-10 bg-sage-50 rounded w-1/3 animate-pulse" />
            <div className="h-32 bg-sage-50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlistItems.some(
    (item) => (item._id || item) === product._id || (typeof item === "object" && item._id === product._id)
  );

  const activePrice = selectedVariant?.price ?? product.price;
  const originalPrice =
    product.discountPercent > 0 ? Math.round((activePrice / (1 - product.discountPercent / 100)) * 100) / 100 : null;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      await dispatch(
        addToCart({
          product,
          variantId: selectedVariant?._id || null,
          quantity,
        })
      ).unwrap();
      setToastMessage(`Added ${quantity} × ${product.name} to cart!`);
      setToastType("success");
    } catch (err) {
      setToastMessage(err || "Failed to add item to cart");
      setToastType("error");
    }
  };

  const handleToggleWishlist = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isWishlisted) {
      dispatch(removeFromWishlist(product._id));
      setToastMessage("Removed from wishlist");
    } else {
      dispatch(addToWishlist(product._id));
      setToastMessage("Saved to wishlist!");
    }
    setToastType("info");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmittingReview(true);
    try {
      await dispatch(
        submitReview({
          productId: product._id,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        })
      ).unwrap();
      setReviewTitle("");
      setReviewComment("");
      setToastMessage("Thank you! Your review has been submitted for moderation.");
      setToastType("success");
    } catch (err) {
      setToastMessage(err || "Failed to submit review");
      setToastType("error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = product.images?.length
    ? product.images
    : [{ url: "https://via.placeholder.com/600x600?text=Little+Sprout+Toy", altText: product.name }];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Alert */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      {/* Breadcrumbs */}
      <nav className="text-xs text-ink/60 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-sage-700">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-sage-700">Shop</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/products?category=${product.category._id || product.category}`} className="hover:text-sage-700">
              {product.category.name || "Category"}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12 border-b border-sage-100">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="bg-white rounded-soft overflow-hidden border border-sage-100 aspect-square flex items-center justify-center p-4">
            <img
              src={images[selectedImage]?.url}
              alt={images[selectedImage]?.altText || product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-18 h-18 rounded-soft border overflow-hidden flex-shrink-0 transition-all ${
                    selectedImage === idx ? "border-sage-600 ring-2 ring-sage-600/30" : "border-sage-100 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt={img.altText || ""} className="w-16 h-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full">
                {product.brand}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-apricot-500 bg-apricot-100 px-2.5 py-0.5 rounded-full">
                Age: {product.ageRange}
              </span>
              <StatusBadge status={product.inventoryStatus} type="stock" />
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <StarRating rating={product.rating?.average || 0} count={product.rating?.count || 0} />
              <span className="text-xs text-ink/40">• SKU: {product.sku}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-sage-100">
            <span className="text-3xl font-bold text-sage-700">${activePrice.toFixed(2)}</span>
            {originalPrice && (
              <>
                <span className="text-lg text-ink/40 line-through">${originalPrice.toFixed(2)}</span>
                <span className="text-xs font-bold text-apricot-500 bg-apricot-100 px-2 py-0.5 rounded-full">
                  {product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Variants Selector (if any) */}
          {product.variants?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                Select Option:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-soft text-xs font-medium border transition-all ${
                      selectedVariant?._id === v._id
                        ? "border-sage-600 bg-sage-50 text-sage-700 font-bold"
                        : "border-sage-100 text-ink/70 hover:border-sage-300"
                    }`}
                  >
                    {v.color || v.size || v.model || v.sku} {v.price ? `($${v.price.toFixed(2)})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Choking hazard warning banner if applicable */}
          {product.safetyInfo?.chokingWarning && (
            <div className="p-3 bg-amber-50 rounded-soft border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <span className="text-amber-600 text-base">⚠️</span>
              <div>
                <strong className="font-semibold">Safety Notice:</strong> Contains small parts or balls. Recommended for supervised play.
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-sage-200 rounded-soft bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-10 h-10 flex items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="w-10 h-10 flex items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 rounded-soft bg-sage-600 text-white py-3 px-6 font-semibold text-sm hover:bg-sage-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                🛒 {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`w-12 h-11 rounded-soft border flex items-center justify-center transition-colors ${
                  isWishlisted
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "border-sage-200 text-ink/60 hover:text-rose-600 hover:border-rose-200 bg-white"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
            {currentStock > 0 && currentStock <= 5 && (
              <p className="text-xs text-amber-700 font-medium">⚡ Only {currentStock} left in stock — order soon!</p>
            )}
          </div>

          {/* Quick trust assurances */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-sage-100 text-xs text-ink/70">
            <div className="flex items-center gap-2">
              <span>🌱</span> <span>100% BPA & Phthalate Free</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚚</span> <span>Free US Shipping over $50</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛡️</span> <span>ASTM Safety Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔄</span> <span>30-Day Happiness Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description / Safety Specs / Shipping */}
      <div className="mt-10">
        <div className="flex border-b border-sage-200 gap-8">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "description"
                ? "border-sage-600 text-sage-700"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab("safety")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "safety"
                ? "border-sage-600 text-sage-700"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            🛡️ Safety & Materials
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "reviews"
                ? "border-sage-600 text-sage-700"
                : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        <div className="py-6">
          {activeTab === "description" && (
            <div className="prose max-w-none text-sm text-ink/80 leading-relaxed">
              <p>{product.description}</p>
              <div className="mt-6 p-4 rounded-soft bg-sage-50/70 border border-sage-100 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-ink/50 block">Brand</span>
                  <span className="text-sm font-semibold text-ink">{product.brand}</span>
                </div>
                <div>
                  <span className="text-xs text-ink/50 block">Recommended Age</span>
                  <span className="text-sm font-semibold text-ink">{product.ageRange}</span>
                </div>
                <div>
                  <span className="text-xs text-ink/50 block">Category</span>
                  <span className="text-sm font-semibold text-ink">{product.category?.name || "Toys"}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "safety" && (
            <div className="space-y-4">
              <div className="p-4 rounded-soft bg-white border border-sage-100 shadow-sm space-y-3 text-sm">
                <h3 className="font-semibold text-ink flex items-center gap-2">
                  <span>🛡️</span> Safety Standards & Lab Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-ink/50 block">Primary Materials</span>
                    <span className="font-semibold text-ink">{product.safetyInfo?.material || "Non-toxic organic materials"}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block">Safety Certification</span>
                    <span className="font-semibold text-ink">{product.safetyInfo?.certification || "ASTM F963 / EN71 Certified"}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block">Battery Requirements</span>
                    <span className="font-semibold text-ink">{product.safetyInfo?.batteryInfo || "None required"}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block">Choking Hazard Advisory</span>
                    <span className="font-semibold text-ink">
                      {product.safetyInfo?.chokingWarning ? "Yes — small parts (supervision required)" : "None — suitable for infants"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              {/* Ratings overview */}
              <div className="p-6 rounded-soft bg-white border border-sage-100 flex flex-col md:flex-row items-center gap-8">
                <div className="text-center md:border-r border-sage-100 md:pr-8">
                  <div className="text-4xl font-display font-bold text-sage-700">
                    {(product.rating?.average || 0).toFixed(1)}
                  </div>
                  <StarRating rating={product.rating?.average || 0} size="lg" />
                  <p className="text-xs text-ink/50 mt-1">Based on {product.rating?.count || 0} verified ratings</p>
                </div>

                {/* Rating bars */}
                <div className="flex-1 w-full space-y-1 text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = product.rating?.distribution?.[stars] || 0;
                    const pct = product.rating?.count > 0 ? (count / product.rating.count) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-8 text-right font-medium">{stars} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-sage-50 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-ink/40 text-[11px]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write review form */}
              <div className="p-6 rounded-soft bg-sage-50/50 border border-sage-100">
                <h3 className="font-semibold text-sm text-ink mb-3">Leave a Customer Review</h3>
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Your Rating</label>
                      <StarRating rating={reviewRating} interactive={true} onChange={setReviewRating} size="lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Review Title</label>
                      <input
                        type="text"
                        required
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g. My 6-month-old absolutely adores this!"
                        className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 bg-white focus:border-sage-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Your Review</label>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with product safety, durability, and baby's enjoyment..."
                        className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 bg-white focus:border-sage-600 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-soft bg-sage-600 text-white px-4 py-2 text-xs font-medium hover:bg-sage-700 transition-colors disabled:opacity-60"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-ink/60">
                    Please <Link to="/login" className="text-sage-600 font-bold underline">log in</Link> to share a verified customer review.
                  </p>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-ink">Recent Reviews</h4>
                {reviews.length === 0 ? (
                  <p className="text-xs text-ink/50 italic">No reviews yet for this product. Be the first to review!</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r._id} className="p-4 rounded-soft bg-white border border-sage-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating rating={r.rating} />
                          <span className="font-semibold text-xs text-ink">{r.title}</span>
                        </div>
                        <span className="text-[11px] text-ink/40">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-ink/70">{r.comment}</p>
                      <div className="flex items-center gap-2 text-[11px] text-ink/50">
                        <span>By {r.user?.name || "Verified Customer"}</span>
                        {r.verifiedPurchase && (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
