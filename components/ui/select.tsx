"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "interactive-surface flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] px-4 text-sm text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18),0_18px_42px_-28px_rgba(34,211,238,0.4)]",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 text-zinc-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          "z-50 max-h-[min(70vh,28rem)] min-w-[8rem] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(5,10,21,0.98))] p-1 shadow-[0_28px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="max-h-[min(70vh,28rem)] overflow-y-auto p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "interactive-surface relative flex cursor-default select-none items-center rounded-xl py-2.5 pl-9 pr-3 text-sm text-zinc-200 outline-none data-[highlighted]:bg-white/8 data-[highlighted]:text-zinc-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-3 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
