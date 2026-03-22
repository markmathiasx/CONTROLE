"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "liquid-chip inline-flex rounded-2xl p-1 shadow-[0_18px_44px_-34px_rgba(0,0,0,0.9)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "interactive-surface rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition data-[state=active]:bg-[linear-gradient(135deg,rgba(16,185,129,0.92),rgba(34,211,238,0.82))] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_18px_36px_-24px_rgba(16,185,129,0.62)]",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
