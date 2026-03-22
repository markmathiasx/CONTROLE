import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="interactive-surface overflow-hidden">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="liquid-chip inline-flex rounded-2xl p-4 text-zinc-200">
          <Icon className="size-6 text-zinc-200" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-semibold text-zinc-50">{title}</h3>
          <p className="max-w-[34rem] text-sm leading-6 text-zinc-400">{description}</p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
