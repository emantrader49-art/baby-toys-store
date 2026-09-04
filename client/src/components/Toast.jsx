import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgStyles = {
    success: "bg-sage-700 text-white shadow-lg",
    error: "bg-rose-600 text-white shadow-lg",
    info: "bg-ink text-white shadow-lg",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-soft text-sm font-medium ${
          bgStyles[type] || bgStyles.info
        }`}
      >
        {type === "success" && (
          <svg className="w-5 h-5 text-sage-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === "error" && (
          <svg className="w-5 h-5 text-rose-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span>{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-2">
          ✕
        </button>
      </div>
    </div>
  );
}
