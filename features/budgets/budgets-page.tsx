"use client";

import * as React from "react";
import { PiggyBank } from "lucide-react";

import { BudgetProgressCard } from "@/components/shared/budget-progress-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceStore } from "@/store/use-finance-store";
import type { BudgetFormValues } from "@/types/forms";
import { getBudgetUsage } from "@/utils/finance";

export function BudgetsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const saveBudget = useFinanceStore((state) => state.saveBudget);
  const [form, setForm] = React.useState<BudgetFormValues>({
    categoryId: "",
    month: selectedMonth,
    limit: 200,
  });

  React.useEffect(() => {
    setForm((current) => ({ ...current, month: selectedMonth }));
  }, [selectedMonth]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={3} rows={2} />;
  }

  const budgetUsage = getBudgetUsage(snapshot, selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Orçamentos</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Metas visíveis para segurar o mês antes de estourar.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Definir orçamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.categoryId} onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a categoria" />
              </SelectTrigger>
              <SelectContent>
                {snapshot.categories
                  .filter((category) => !category.archivedAt && category.budgetable)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mês</Label>
            <Input type="month" value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Limite</Label>
            <Input type="number" value={form.limit} onChange={(event) => setForm((current) => ({ ...current, limit: Number(event.target.value) }))} />
          </div>
          <div className="md:col-span-3">
            <Button type="button" onClick={() => saveBudget(form)}>
              Salvar orçamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {budgetUsage.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {budgetUsage.map((item) => (
            <BudgetProgressCard
              key={item.budget.id}
              title={item.category?.name ?? "Categoria"}
              spent={item.spent}
              limit={item.budget.limit}
              percentage={item.percentage}
              status={item.status}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PiggyBank}
          title="Nenhum orçamento criado"
          description="Defina um limite para as categorias que mais pesam no mês e acompanhe tudo em tempo real."
          action={
            <Button type="button" onClick={() => setForm((current) => ({ ...current, month: selectedMonth }))}>
              Criar primeiro orçamento
            </Button>
          }
        />
      )}
    </div>
  );
}
