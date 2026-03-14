import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
          <Icon className="size-6 text-zinc-200" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-semibold text-zinc-50">{title}</h3>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
