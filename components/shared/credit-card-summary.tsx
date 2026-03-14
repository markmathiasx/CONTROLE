import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL, formatPercentage } from "@/lib/formatters";
import type { CardInvoice } from "@/types/domain";

export function CreditCardSummary({
  name,
  color,
  limit,
  currentInvoice,
  futureCommitment,
}: {
  name: string;
  color: string;
  limit: number;
  currentInvoice: CardInvoice | undefined;
  futureCommitment: number;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="rounded-2xl p-3"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-zinc-50">{name}</p>
              <p className="text-sm text-zinc-400">
                Limite {formatCurrencyBRL(limit)}
              </p>
            </div>
          </div>
          {currentInvoice ? (
            <Badge
              variant={
                currentInvoice.utilization >= 80
                  ? "danger"
                  : currentInvoice.utilization >= 50
                    ? "warning"
                    : "default"
              }
            >
              {formatPercentage(currentInvoice.utilization)}
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Fatura atual</p>
            <p className="mt-2 font-heading text-xl font-semibold text-zinc-50">
              {formatCurrencyBRL(currentInvoice?.total ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Parcelas futuras</p>
            <p className="mt-2 font-heading text-xl font-semibold text-zinc-50">
              {formatCurrencyBRL(futureCommitment)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
