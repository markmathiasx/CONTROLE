import { LoadingCard } from "@/components/shared/loading-card";

export function PageSkeleton({
  cards = 4,
  rows = 2,
}: {
  cards?: number;
  rows?: number;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-white/8" />
        <div className="h-10 w-[min(30rem,85%)] animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-[min(38rem,92%)] animate-pulse rounded-full bg-white/8" />
      </div>

      <div
        className={`grid gap-4 ${
          cards >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : cards === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {Array.from({ length: cards }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] border border-white/8 bg-white/6 p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,1)]"
          >
            <div className="mb-5 h-5 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, innerIndex) => (
                <div
                  key={innerIndex}
                  className="h-14 animate-pulse rounded-2xl bg-black/25"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
