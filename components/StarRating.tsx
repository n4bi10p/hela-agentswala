"use client";

type StarRatingProps = {
  value: number;        // current rating (0–5, can be decimal for display)
  onChange?: (star: number) => void; // undefined = read-only
  size?: "sm" | "md" | "lg";
};

const SIZE_MAP = {
  sm: "text-sm gap-0.5",
  md: "text-xl gap-1",
  lg: "text-2xl gap-1.5"
};

export function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const isInteractive = Boolean(onChange);
  const sizeClass = SIZE_MAP[size];

  return (
    <div
      className={`flex items-center ${sizeClass}`}
      role={isInteractive ? "radiogroup" : undefined}
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const halfFilled = !filled && value >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
            className={[
              "transition-transform duration-100 select-none",
              isInteractive
                ? "cursor-pointer hover:scale-125 active:scale-110"
                : "cursor-default pointer-events-none",
              filled
                ? "text-amber-400"
                : halfFilled
                  ? "text-amber-400/60"
                  : "text-white/20"
            ].join(" ")}
            style={{ background: "none", border: "none", padding: 0, lineHeight: 1 }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
