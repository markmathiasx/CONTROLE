import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-5">
        <div className="skeleton-shimmer h-4 w-28 rounded-full bg-white/8" />
        <div className="skeleton-shimmer h-8 w-40 rounded-full bg-white/10" />
        <div className="skeleton-shimmer h-3 w-full rounded-full bg-white/8" />
      </CardContent>
    </Card>
  );
}
