import * as React from "react";

import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { CostCenter } from "@/types/domain";

export function ProfilePill({
  profile,
  className,
}: {
  profile?: CostCenter | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-100",
        className,
      )}
      style={{
        backgroundColor: profile ? `${profile.color}20` : "rgba(255,255,255,0.06)",
      }}
    >
      {React.createElement(getIcon(profile?.icon ?? "wallet"), {
        className: "size-3.5",
        style: { color: profile?.color ?? "#10b981" },
      })}
      {profile?.name ?? "Centro"}
    </span>
  );
}
