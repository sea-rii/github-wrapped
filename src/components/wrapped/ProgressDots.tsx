"use client";

export function ProgressDots({
  total,
  index,
  onGo,
}: {
  total: number;
  index: number;
  onGo: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onGo(i)}
          className={[
            "h-2 rounded-full transition-all",
            i === index ? "w-10 bg-white/90" : "w-2 bg-white/25 hover:bg-white/40",
          ].join(" ")}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}
