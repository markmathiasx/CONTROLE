import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "liquid-chip inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide shadow-[0_14px_34px_-26px_rgba(0,0,0,0.9)]",
  {
    variants: {
      variant: {
        default: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
        muted: "border-white/10 bg-white/6 text-zinc-300",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
        danger: "border-rose-400/20 bg-rose-400/10 text-rose-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
