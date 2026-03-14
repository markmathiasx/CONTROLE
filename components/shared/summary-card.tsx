import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = "from-emerald-400/20 via-emerald-500/10 to-transparent",
  badge,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  accent?: string;
  badge?: { text: string; tone?: "default" | "muted" | "warning" | "danger" };
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="relative p-5">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", accent)} />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <Icon className="size-5 text-zinc-50" />
            </div>
            {badge ? <Badge variant={badge.tone}>{badge.text}</Badge> : null}
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">{label}</p>
            <h3 className="font-heading text-2xl font-semibold text-zinc-50">{value}</h3>
            {detail ? <p className="text-sm text-zinc-300">{detail}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
