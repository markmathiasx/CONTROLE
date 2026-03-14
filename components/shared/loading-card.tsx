import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/8" />
        <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded-full bg-white/8" />
      </CardContent>
    </Card>
  );
}
