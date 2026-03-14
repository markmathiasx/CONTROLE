"use client";

import { CalendarRange } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { FutureInstallmentsList } from "@/components/shared/future-installments-list";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { useFinanceStore } from "@/store/use-finance-store";
import { getFutureInstallmentsByMonth } from "@/utils/finance";

export function InstallmentsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);

  if (!initialized || !snapshot) {
    return null;
  }

  const items = getFutureInstallmentsByMonth(snapshot, selectedMonth, 6).filter(
    (item) => item.total > 0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Agenda do cartão</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Parcelas mês a mês, por cartão e centro.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {items.length ? (
        <FutureInstallmentsList items={items} snapshot={snapshot} />
      ) : (
        <EmptyState
          icon={CalendarRange}
          title="Sem parcelas futuras"
          description="Quando você parcelar no crédito, o impacto aparece aqui por mês."
        />
      )}
    </div>
  );
}
