"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500 text-zinc-950 shadow-[0_16px_40px_-18px_rgba(16,185,129,0.8)] hover:-translate-y-0.5 hover:bg-emerald-400",
        secondary:
          "border border-white/10 bg-white/8 text-zinc-100 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.8)] hover:-translate-y-0.5 hover:bg-white/12",
        ghost: "text-zinc-300 hover:bg-white/8 hover:text-white",
        outline:
          "border border-white/10 bg-transparent text-zinc-100 hover:-translate-y-0.5 hover:bg-white/6",
        destructive:
          "bg-rose-500/90 text-white shadow-[0_16px_40px_-18px_rgba(244,63,94,0.8)] hover:-translate-y-0.5 hover:bg-rose-400",
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
