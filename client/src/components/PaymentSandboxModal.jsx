import { useState } from "react";

export default function PaymentSandboxModal({ order, onPay, loading }) {
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expDate, setExpDate] = useState("12/28");
  const [cvc, setCvc] = useState("321");
  const [cardHolder, setCardHolder] = useState(order?.address?.fullName || "Cardholder Name");
  const [selectedPreset, setSelectedPreset] = useState("visa_success");

  const testCards = [
    {
      id: "visa_success",
      label: "Visa (Success)",
      number: "4242 4242 4242 4242",
      exp: "12/28",
      cvc: "321",
      badge: "Pass",
    },
    {
      id: "mc_success",
      label: "Mastercard (Success)",
      number: "5555 5555 5555 4444",
      exp: "10/29",
      cvc: "888",
      badge: "Pass",
    },
  ];

  const handleSelectPreset = (card) => {
    setSelectedPreset(card.id);
    setCardNumber(card.number);
    setExpDate(card.exp);
    setCvc(card.cvc);
  };

  const handlePay = (e) => {
    e.preventDefault();
    onPay({
      cardNumber,
      expDate,
      cvc,
      cardHolder,
    });
  };

  return (
    <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-sage-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center text-sage-600 font-bold text-sm">
            💳
          </div>
          <div>
            <h3 className="font-semibold text-ink text-sm">Stripe Payment Gateway</h3>
            <p className="text-xs text-ink/50">256-bit encrypted sandbox checkout</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sage-50 text-sage-700 border border-sage-200">
          Sandbox Test Mode
        </span>
      </div>

      {/* Preset Card Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-ink/70 mb-2">Test Card Presets (1-Click Fill):</label>
        <div className="grid grid-cols-2 gap-2">
          {testCards.map((card) => (
            <button
              type="button"
              key={card.id}
              onClick={() => handleSelectPreset(card)}
              className={`text-left p-2.5 rounded-soft border text-xs transition-all ${
                selectedPreset === card.id
                  ? "border-sage-600 bg-sage-50/60 font-medium"
                  : "border-sage-100 hover:border-sage-300 bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span>{card.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {card.badge}
                </span>
              </div>
              <p className="text-ink/60 font-mono text-[11px]">{card.number}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Card Entry Form */}
      <form onSubmit={handlePay} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Cardholder Name</label>
          <input
            type="text"
            required
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="w-full text-sm rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Card Number</label>
          <div className="relative">
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full text-sm font-mono rounded-soft border border-sage-100 px-3 py-2 pr-10 focus:border-sage-600 focus:outline-none"
              placeholder="4242 4242 4242 4242"
            />
            <span className="absolute right-3 top-2.5 text-xs text-ink/40">🔒</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Expiration</label>
            <input
              type="text"
              required
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full text-sm font-mono rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">CVC / CVV</label>
            <input
              type="text"
              required
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full text-sm font-mono rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
              placeholder="123"
            />
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-soft bg-sage-600 text-white py-3 px-4 font-semibold text-sm hover:bg-sage-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing Payment...
              </>
            ) : (
              `Pay $${(order?.pricing?.total || 0).toFixed(2)} with Stripe`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
