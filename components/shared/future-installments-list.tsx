import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrencyBRL, formatMonthShortLabel } from "@/lib/formatters";
import type { WorkspaceSnapshot } from "@/types/domain";

export function FutureInstallmentsList({
  items,
  snapshot,
}: {
  items: Array<{
    month: string;
    total: number;
    installments: WorkspaceSnapshot["installments"];
  }>;
  snapshot: WorkspaceSnapshot;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.month}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-50">{formatMonthShortLabel(item.month)}</p>
                <p className="text-sm text-zinc-400">
                  {item.installments.length} parcela(s)
                </p>
              </div>
              <p className="font-heading text-lg font-semibold text-zinc-50">
                {formatCompactCurrencyBRL(item.total)}
              </p>
            </div>
            <div className="space-y-2">
              {item.installments.slice(0, 4).map((installment) => {
                const card = snapshot.cards.find((entry) => entry.id === installment.cardId);
                const profile = snapshot.costCenters.find(
                  (entry) => entry.id === installment.centerId,
                );
                const category = snapshot.categories.find(
                  (entry) => entry.id === installment.categoryId,
                );

                return (
                  <div
                    key={installment.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/6 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {card?.name ?? "Cartão"} • {installment.installmentNumber}/
                        {installment.totalInstallments}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {profile?.name ?? "Centro"} • {category?.name ?? "Categoria"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-50">
                      {formatCompactCurrencyBRL(installment.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
