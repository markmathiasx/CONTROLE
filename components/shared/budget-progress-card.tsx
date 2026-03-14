import { AlertTriangle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL, formatPercentage } from "@/lib/formatters";

export function BudgetProgressCard({
  title,
  spent,
  limit,
  percentage,
  status,
}: {
  title: string;
  spent: number;
  limit: number;
  percentage: number;
  status: "healthy" | "warning" | "critical";
}) {
  const progress = Math.min(100, percentage);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-50">{title}</p>
            <p className="text-sm text-zinc-400">
              {formatCurrencyBRL(spent)} de {formatCurrencyBRL(limit)}
            </p>
          </div>
          {status !== "healthy" ? (
            <AlertTriangle
              className={`size-4 ${status === "critical" ? "text-rose-300" : "text-amber-300"}`}
            />
          ) : null}
        </div>
        <Progress
          value={progress}
          className={status === "critical" ? "[&>*]:bg-rose-400" : status === "warning" ? "[&>*]:bg-amber-400" : ""}
        />
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          {formatPercentage(percentage)}
        </p>
      </CardContent>
    </Card>
  );
}
