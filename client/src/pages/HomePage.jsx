import { Link } from "react-router-dom";

export default function HomePage() {
  const ageGroups = [
    { label: "0 - 6 Months", range: "0-6m", icon: "🍼", desc: "Sensory & Teething" },
    { label: "6 - 12 Months", range: "6-12m", icon: "🧸", desc: "Crawling & Grasping" },
    { label: "1 - 2 Years", range: "1-2y", icon: "🧩", desc: "Walking & First Puzzles" },
    { label: "3 - 5 Years", range: "3-5y", icon: "🎨", desc: "Montessori & Creative" },
    { label: "6 - 8 Years", range: "6-8y", icon: "🔬", desc: "STEM & Building" },
    { label: "9+ Years", range: "9y+", icon: "🚀", desc: "Advanced Play & Robotics" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-cream py-16 md:py-24 border-b border-sage-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-sage-700 bg-sage-100 mb-4">
            🌿 Certified Safe • Non-Toxic Toys
          </span>
          <h1 className="font-display text-4xl md:text-6xl text-ink font-bold leading-tight mb-4">
            Toys your little one will love,<br />
            <span className="text-sage-700">safety you can trust.</span>
          </h1>
          <p className="text-ink/70 max-w-lg mx-auto mb-8 text-base">
            Thoughtfully crafted toys for newborns through age 9+. Every single product is lab-tested, BPA-free, and ASTM certified.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/products"
              className="rounded-soft bg-apricot-500 text-white px-8 py-3.5 font-bold hover:bg-apricot-400 transition-colors shadow-md hover:shadow-lg text-sm"
            >
              Shop All Toys
            </Link>
            <Link
              to="/products?ageRange=0-6m"
              className="rounded-soft bg-white text-ink border border-sage-200 px-6 py-3.5 font-semibold hover:bg-sage-50 transition-colors text-sm"
            >
              Newborn Essentials (0-6m)
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Age Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">Shop by Developmental Age</h2>
          <p className="text-xs text-ink/60 mt-1">Carefully calibrated toys designed for your baby's current milestone.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ageGroups.map((age) => (
            <Link
              key={age.range}
              to={`/products?ageRange=${age.range}`}
              className="bg-white rounded-soft border border-sage-100 p-4 text-center shadow-xs hover:shadow-md hover:border-sage-300 transition-all group flex flex-col items-center justify-between"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{age.icon}</span>
              <h3 className="text-xs font-bold text-ink mb-1">{age.label}</h3>
              <p className="text-[11px] text-ink/50">{age.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-sage-700 text-white rounded-soft p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase font-bold tracking-wider text-apricot-400">Special Welcome Offer</span>
            <h3 className="font-display text-2xl md:text-3xl font-bold">Get 10% Off Your First Order</h3>
            <p className="text-xs text-sage-100 max-w-md">
              Use promo code <span className="font-mono font-bold bg-sage-800/60 px-2 py-0.5 rounded text-white">WELCOME10</span> at checkout on orders over $20.
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-soft bg-white text-sage-700 px-6 py-3 text-xs font-bold hover:bg-sage-50 transition-colors shadow-sm flex-shrink-0"
          >
            Claim 10% Discount →
          </Link>
        </div>
      </section>
    </div>
  );
}
