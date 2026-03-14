"use client";

import * as React from "react";
import { ReceiptText } from "lucide-react";

import { CreditCardSummary } from "@/components/shared/credit-card-summary";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceSummaryCard } from "@/components/shared/invoice-summary-card";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyBRL } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import type { CardFormValues } from "@/types/forms";
import { getCardInvoices } from "@/utils/finance";

const initialForm: CardFormValues = {
  name: "",
  brand: "",
  last4: "",
  limit: 1500,
  bestPurchaseDay: 10,
  dueDay: 17,
  color: "#10b981",
  aliases: "",
};

export function CardsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const saveCard = useFinanceStore((state) => state.saveCard);
  const archiveCard = useFinanceStore((state) => state.archiveCard);
  const [form, setForm] = React.useState<CardFormValues>(initialForm);

  if (!initialized || !snapshot) {
    return null;
  }

  const invoices = getCardInvoices(snapshot, selectedMonth);
  const futureByCard = snapshot.cards.reduce<Record<string, number>>((accumulator, card) => {
    accumulator[card.id] = snapshot.installments
      .filter((installment) => installment.cardId === card.id && installment.invoiceMonth > selectedMonth)
      .reduce((sum, installment) => sum + installment.amount, 0);
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Cartões e limite</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Veja a fatura atual e o impacto dos próximos meses.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo cartão</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Bandeira</Label>
            <Input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Final</Label>
            <Input value={form.last4} onChange={(event) => setForm((current) => ({ ...current, last4: event.target.value }))} maxLength={4} />
          </div>
          <div className="space-y-2">
            <Label>Limite</Label>
            <Input type="number" value={form.limit} onChange={(event) => setForm((current) => ({ ...current, limit: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Melhor dia</Label>
            <Input type="number" value={form.bestPurchaseDay} onChange={(event) => setForm((current) => ({ ...current, bestPurchaseDay: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <Input type="number" value={form.dueDay} onChange={(event) => setForm((current) => ({ ...current, dueDay: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <Input value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Aliases</Label>
            <Input value={form.aliases} onChange={(event) => setForm((current) => ({ ...current, aliases: event.target.value }))} placeholder="nu, roxinho" />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <Button
              type="button"
              onClick={() => {
                saveCard(form);
                setForm(initialForm);
              }}
            >
              Salvar cartão
            </Button>
          </div>
        </CardContent>
      </Card>

      {snapshot.cards.filter((card) => card.active).length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {snapshot.cards
            .filter((card) => card.active)
            .map((card) => (
              <div key={card.id} className="space-y-3">
                <CreditCardSummary
                  name={`${card.name} •••• ${card.last4}`}
                  color={card.color}
                  limit={card.limit}
                  currentInvoice={invoices.find((invoice) => invoice.cardId === card.id)}
                  futureCommitment={futureByCard[card.id] ?? 0}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setForm({
                        id: card.id,
                        name: card.name,
                        brand: card.brand,
                        last4: card.last4,
                        limit: card.limit,
                        bestPurchaseDay: card.bestPurchaseDay,
                        dueDay: card.dueDay,
                        color: card.color,
                        aliases: card.aliases.join(", "),
                      })
                    }
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" onClick={() => archiveCard(card.id)}>
                    Arquivar
                  </Button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="Nenhum cartão ativo"
          description="Cadastre ao menos um cartão para controlar fatura e parcelamentos."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {invoices.map((invoice) => (
          <InvoiceSummaryCard
            key={invoice.cardId}
            invoice={invoice}
            card={snapshot.cards.find((card) => card.id === invoice.cardId)}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compras recentes no crédito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.transactions
            .filter((transaction) => transaction.paymentMethod === "credit")
            .slice(0, 8)
            .map((transaction) => {
              const card = snapshot.cards.find((item) => item.id === transaction.cardId);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-50">{transaction.description}</p>
                    <p className="text-sm text-zinc-400">
                      {card?.name ?? "Cartão"} • {transaction.installments}x
                    </p>
                  </div>
                  <p className="font-medium text-zinc-50">{formatCurrencyBRL(transaction.amount)}</p>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
