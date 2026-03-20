"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Wallet } from "lucide-react";

import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { EntryForm } from "@/components/shared/entry-form";
import { PaymentBadge } from "@/components/shared/payment-badge";
import { ProfilePill } from "@/components/shared/profile-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrencyBRL } from "@/lib/formatters";
import type { WorkspaceSnapshot } from "@/types/domain";
import { useFinanceStore } from "@/store/use-finance-store";
import { listUnifiedEntries } from "@/utils/finance";

export function TransactionList({
  snapshot,
  monthKey,
  search,
  entries: providedEntries,
}: {
  snapshot: WorkspaceSnapshot;
  monthKey?: string;
  search?: string;
  entries?: ReturnType<typeof listUnifiedEntries>;
}) {
  const deleteEntry = useFinanceStore((state) => state.deleteEntry);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingKind, setEditingKind] = React.useState<"expense" | "income">("expense");

  const entries = (providedEntries ?? listUnifiedEntries(snapshot, monthKey)).filter((entry) =>
    search
      ? `${entry.description} ${entry.date} ${entry.vehicleName ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  const grouped = entries.reduce<Record<string, typeof entries>>((accumulator, entry) => {
    const label = format(parseISO(entry.date), "dd 'de' MMMM", { locale: ptBR });
    accumulator[label] ??= [];
    accumulator[label].push(entry);
    return accumulator;
  }, {});

  const currentExpense =
    editingId && editingKind === "expense"
      ? snapshot.transactions.find((transaction) => transaction.id === editingId)
      : null;
  const currentIncome =
    editingId && editingKind === "income"
      ? snapshot.incomes.find((income) => income.id === editingId)
      : null;

  if (!entries.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="Nenhum lançamento encontrado"
        description="Use o modal rápido ou o formulário completo para começar a preencher seu mês."
      />
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([label, items]) => (
        <section key={label} className="space-y-2">
          <p className="px-1 text-xs uppercase tracking-[0.28em] text-zinc-500">{label}</p>
          <div className="space-y-2">
            {items.map((entry) => {
              const profile = snapshot.costCenters.find((item) => item.id === entry.centerId);
              const category = snapshot.categories.find((item) => item.id === entry.categoryId);
              const locked =
                entry.kind === "expense"
                  ? snapshot.transactions.find((item) => item.id === entry.id)?.lockedByOrigin
                  : snapshot.incomes.find((item) => item.id === entry.id)?.lockedByOrigin;

              return (
                <Card key={entry.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0 space-y-3">
                      <div className="space-y-1">
                        <p className="font-medium text-zinc-50">{entry.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <ProfilePill profile={profile} />
                          {entry.kind === "expense" && category ? (
                            <CategoryBadge category={category} />
                          ) : (
                            <Badge variant="muted">Receita</Badge>
                          )}
                          {entry.kind === "expense" && entry.paymentMethod ? (
                            <PaymentBadge method={entry.paymentMethod} />
                          ) : (
                            <Badge>{entry.incomeType ?? "Entrada"}</Badge>
                          )}
                          {entry.vehicleName ? <Badge variant="muted">{entry.vehicleName}</Badge> : null}
                          {locked ? <Badge variant="muted">Vinculado</Badge> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p
                        className={`font-heading text-lg font-semibold ${
                          entry.kind === "income" ? "text-emerald-300" : "text-zinc-50"
                        }`}
                      >
                        {entry.kind === "income" ? "+" : "-"}
                        {formatCurrencyBRL(entry.amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={locked}
                          onClick={() => {
                            setEditingId(entry.id);
                            setEditingKind(entry.kind);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={locked}
                          onClick={() => deleteEntry(entry.id, entry.kind)}
                        >
                          <Trash2 className="size-4 text-rose-300" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <Dialog open={Boolean(editingId)} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
          </DialogHeader>

          {editingKind === "expense" && currentExpense ? (
            <EntryForm
              initialValues={{
                id: currentExpense.id,
                kind: "expense",
                description: currentExpense.description,
                amount: currentExpense.amount,
                date: currentExpense.transactionDate,
                centerId: currentExpense.centerId,
                categoryId: currentExpense.categoryId,
                paymentMethod: currentExpense.paymentMethod,
                cardId: currentExpense.cardId ?? undefined,
                installments: currentExpense.installments,
                notes: currentExpense.notes ?? "",
                recurrenceFrequency:
                  snapshot.recurrences.find((rule) => rule.id === currentExpense.recurrenceRuleId)
                    ?.frequency ?? "none",
                recurrenceEndDate:
                  snapshot.recurrences.find((rule) => rule.id === currentExpense.recurrenceRuleId)
                    ?.endDate ?? undefined,
              }}
              centers={snapshot.costCenters}
              categories={snapshot.categories}
              cards={snapshot.cards}
              onSaved={() => setEditingId(null)}
            />
          ) : null}

          {editingKind === "income" && currentIncome ? (
            <EntryForm
              initialValues={{
                id: currentIncome.id,
                kind: "income",
                description: currentIncome.description,
                amount: currentIncome.amount,
                date: currentIncome.receivedAt,
                centerId: currentIncome.centerId,
                paymentMethod: "pix",
                installments: 1,
                notes: currentIncome.notes ?? "",
                incomeType: currentIncome.incomeType,
                wallet: currentIncome.wallet,
                recurrenceFrequency:
                  snapshot.recurrences.find((rule) => rule.id === currentIncome.recurrenceRuleId)
                    ?.frequency ?? "none",
                recurrenceEndDate:
                  snapshot.recurrences.find((rule) => rule.id === currentIncome.recurrenceRuleId)
                    ?.endDate ?? undefined,
              }}
              centers={snapshot.costCenters}
              categories={snapshot.categories}
              cards={snapshot.cards}
              onSaved={() => setEditingId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
