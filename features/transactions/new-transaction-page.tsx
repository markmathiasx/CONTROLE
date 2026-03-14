"use client";

import { EntryForm } from "@/components/shared/entry-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceStore } from "@/store/use-finance-store";

export function NewTransactionPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);

  if (!initialized || !snapshot) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Formulário completo</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Quando precisar de mais contexto, lance por aqui.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo lançamento</CardTitle>
          <CardDescription>
            Ideal para receitas, recorrências e compras com mais detalhes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntryForm
            centers={snapshot.costCenters}
            categories={snapshot.categories}
            cards={snapshot.cards}
          />
        </CardContent>
      </Card>
    </div>
  );
}
