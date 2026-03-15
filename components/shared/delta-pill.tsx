import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DeltaPill({
  delta,
  text,
  goodWhenPositive = true,
  className,
}: {
  delta: number;
  text: string;
  goodWhenPositive?: boolean;
  className?: string;
}) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  const tone = isNeutral
    ? "muted"
    : goodWhenPositive
      ? isPositive
        ? "default"
        : "danger"
      : isPositive
        ? "danger"
        : "default";

  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Badge className={cn("w-fit whitespace-nowrap", className)} variant={tone}>
      <Icon className="mr-1 size-3.5" />
      {text}
    </Badge>
  );
}
