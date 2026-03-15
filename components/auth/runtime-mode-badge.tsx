"use client";

import { Cloud, CloudOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

type RuntimeModeBadgeProps = {
  className?: string;
};

export function RuntimeModeBadge({ className }: RuntimeModeBadgeProps) {
  const runtimeConfig = useAuthStore((state) => state.runtimeConfig);

  if (runtimeConfig.hasSupabase) {
    return (
      <Badge className={cn("w-fit", className)} variant="default">
        <Cloud className="mr-1 size-3.5" />
        Modo nuvem
      </Badge>
    );
  }

  return (
    <Badge className={cn("w-fit", className)} variant="warning">
      <CloudOff className="mr-1 size-3.5" />
      Modo local
    </Badge>
  );
}
