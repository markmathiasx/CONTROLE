import { LoadingCard } from "@/components/shared/loading-card";

export default function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}
