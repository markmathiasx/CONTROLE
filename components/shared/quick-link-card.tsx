import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QuickLinkCard({
  href,
  icon: Icon,
  title,
  description,
  accent = "from-emerald-400/20 via-emerald-500/10 to-transparent",
  className,
}: {
  href: Route;
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: string;
  className?: string;
}) {
  return (
    <Link href={href} prefetch={false} className={cn("group block", className)}>
      <Card className="interactive-surface overflow-hidden transition-transform hover:-translate-y-1">
        <CardContent className="relative p-5">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-75", accent)} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="liquid-chip inline-flex rounded-2xl p-3 text-zinc-50">
                <Icon className="size-5 text-zinc-50" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-lg font-semibold text-zinc-50">{title}</p>
                <p className="max-w-[28ch] text-sm leading-6 text-zinc-300">{description}</p>
                <p className="pt-1 text-xs uppercase tracking-[0.22em] text-zinc-500 transition group-hover:text-cyan-200">
                  Abrir agora
                </p>
              </div>
            </div>
            <ChevronRight className="mt-1 size-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
