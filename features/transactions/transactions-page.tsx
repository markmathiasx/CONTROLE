"use client";

import * as React from "react";

import { MonthSwitcher } from "@/components/shared/month-switcher";
import { TransactionList } from "@/components/shared/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFinanceStore } from "@/store/use-finance-store";

export function TransactionsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const [search, setSearch] = React.useState("");

  if (!initialized || !snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Feed completo</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Pesquise, filtre e ajuste tudo do mês.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Busca rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Procure por descrição, data ou contexto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardContent>
      </Card>

      <TransactionList snapshot={snapshot} monthKey={selectedMonth} search={search} />
    </div>
  );
}
