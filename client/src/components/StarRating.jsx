import { useState } from "react";

export default function StarRating({ rating = 0, count = null, max = 5, interactive = false, onChange = null, size = "md" }) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const currentVal = hoverRating || rating;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= currentVal;
          const isHalf = !isFilled && starValue - 0.5 <= currentVal;

          return (
            <button
              type="button"
              key={index}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"} text-amber-400 p-0.5`}
            >
              <svg
                className={`${starSizes[size] || starSizes.md} ${
                  isFilled ? "fill-current text-amber-400" : isHalf ? "fill-amber-300 text-amber-300" : "text-gray-200 fill-current"
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          );
        })}
      </div>
      {typeof rating === "number" && !interactive && (
        <span className="text-xs font-semibold text-ink/70">
          {rating.toFixed(1)} {count !== null && <span className="font-normal text-ink/40">({count})</span>}
        </span>
      )}
    </div>
  );
}
