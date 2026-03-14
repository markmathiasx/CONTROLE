import { CalendarClock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL, formatDateBR, formatPercentage } from "@/lib/formatters";
import type { CardInvoice, CreditCard } from "@/types/domain";

export function InvoiceSummaryCard({
  invoice,
  card,
}: {
  invoice: CardInvoice;
  card?: CreditCard;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-zinc-50">{card?.name ?? "Cartão"}</p>
            <p className="text-sm text-zinc-400">{formatDateBR(invoice.dueDate)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
            <CalendarClock className="size-4 text-zinc-200" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-2xl font-semibold text-zinc-50">
              {formatCurrencyBRL(invoice.total)}
            </p>
            <p className="text-sm text-zinc-400">
              {invoice.installments.length} item(ns) na fatura
            </p>
          </div>
          <p className="text-sm text-zinc-300">{formatPercentage(invoice.utilization)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
