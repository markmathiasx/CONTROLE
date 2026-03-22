"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "interactive-surface cta-shine inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(34,211,238,0.88))] text-zinc-950 shadow-[0_18px_46px_-20px_rgba(16,185,129,0.78)] hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-24px_rgba(34,211,238,0.58)]",
        secondary:
          "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] text-zinc-100 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.8)] hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-white/12",
        ghost: "text-zinc-300 hover:bg-white/8 hover:text-white",
        outline:
          "border border-white/10 bg-transparent text-zinc-100 hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-white/6",
        destructive:
          "border border-rose-300/18 bg-[linear-gradient(135deg,rgba(244,63,94,0.92),rgba(251,113,133,0.82))] text-white shadow-[0_16px_40px_-18px_rgba(244,63,94,0.8)] hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-24px_rgba(251,113,133,0.58)]",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-5 text-base",
        icon: "size-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
