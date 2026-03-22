import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "interactive-surface min-h-24 w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] px-4 py-3 text-sm text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/50 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18),0_18px_42px_-28px_rgba(34,211,238,0.4)]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
