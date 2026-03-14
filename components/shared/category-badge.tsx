import * as React from "react";

import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/domain";

export function CategoryBadge({
  category,
  className,
}: {
  category?: Category | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-200",
        className,
      )}
      style={{
        backgroundColor: category ? `${category.color}20` : "rgba(255,255,255,0.06)",
      }}
    >
      {React.createElement(getIcon(category?.icon ?? "circle-ellipsis"), {
        className: "size-3.5",
        style: { color: category?.color ?? "#94a3b8" },
      })}
      {category?.name ?? "Categoria"}
    </span>
  );
}
