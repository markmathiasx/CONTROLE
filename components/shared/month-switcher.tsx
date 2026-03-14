"use client";

import { addMonths, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/formatters";
import { formatMonthKey } from "@/lib/utils";

export function MonthSwitcher({
  month,
  onChange,
}: {
  month: string;
  onChange: (value: string) => void;
}) {
  const monthDate = parseISO(`${month}-01`);

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 p-1">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onChange(formatMonthKey(addMonths(monthDate, -1)))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          {format(monthDate, "yyyy")}
        </p>
        <p className="font-heading text-sm font-semibold text-zinc-50">
          {formatMonthLabel(month)}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onChange(formatMonthKey(addMonths(monthDate, 1)))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
