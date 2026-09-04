import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-sage-100 mt-20 pt-12 pb-8 text-ink/70">
      {/* Trust Badges */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-sage-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">ASTM & CPSC Certified</h4>
            <p className="text-xs text-ink/60 mt-1">Every toy passes rigorous laboratory physical and chemical testing.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">🌱</span>
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">100% Non-Toxic</h4>
            <p className="text-xs text-ink/60 mt-1">Food-grade silicone, natural beechwood, and BPA/phthalate-free finishes.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">🚚</span>
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Free Shipping Over $50</h4>
            <p className="text-xs text-ink/60 mt-1">Quick standard 3-5 business day delivery on all continental orders.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">30-Day Happiness Guarantee</h4>
            <p className="text-xs text-ink/60 mt-1">If your little one isn't smiling, return it for a no-questions-asked refund.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <span className="font-display text-base font-bold text-sage-700">Little Sprout</span>
          <p className="text-xs text-ink/60 mt-2">
            Mindfully designed toys supporting sensory development, motor skills, and creative imagination from 0 to 9+ years.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Shop by Age</h5>
          <ul className="space-y-1.5 text-xs">
            <li><Link to="/products?ageRange=0-6m" className="hover:text-sage-600">0 - 6 Months</Link></li>
            <li><Link to="/products?ageRange=6-12m" className="hover:text-sage-600">6 - 12 Months</Link></li>
            <li><Link to="/products?ageRange=1-2y" className="hover:text-sage-600">1 - 2 Years</Link></li>
            <li><Link to="/products?ageRange=3-5y" className="hover:text-sage-600">3 - 5 Years</Link></li>
            <li><Link to="/products?ageRange=6-8y" className="hover:text-sage-600">6 - 8 Years</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Popular Categories</h5>
          <ul className="space-y-1.5 text-xs">
            <li><Link to="/products" className="hover:text-sage-600">Montessori Learning</Link></li>
            <li><Link to="/products" className="hover:text-sage-600">Pretend Play & Dolls</Link></li>
            <li><Link to="/products" className="hover:text-sage-600">Building Blocks & STEM</Link></li>
            <li><Link to="/products" className="hover:text-sage-600">Rattles & Teethers</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Customer Care</h5>
          <ul className="space-y-1.5 text-xs">
            <li><Link to="/account" className="hover:text-sage-600">Track My Order</Link></li>
            <li><Link to="/account" className="hover:text-sage-600">Returns & Exchanges</Link></li>
            <li><span className="text-ink/60">support@littlesprout.demo</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 pt-4 border-t border-sage-100 flex flex-col sm:flex-row items-center justify-between text-xs text-ink/40">
        <p>© {new Date().getFullYear()} Little Sprout Toy Co. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Built with MERN Stack • Safe & Secure Sandbox Checkout</p>
      </div>
    </footer>
  );
}
