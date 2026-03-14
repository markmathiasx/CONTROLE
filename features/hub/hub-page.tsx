"use client";

import Link from "next/link";
import { Bike, ChevronRight, PiggyBank, Printer, Wallet } from "lucide-react";

import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import { getDashboardSummary, getMotoDashboardSummary, getStoreDashboardSummary } from "@/utils/finance";

export function HubPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);

  if (!initialized || !snapshot) {
    return null;
  }

  const finance = getDashboardSummary(snapshot, selectedMonth);
  const moto = getMotoDashboardSummary(snapshot, selectedMonth);
  const store = getStoreDashboardSummary(snapshot, selectedMonth);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Hub consolidado</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Financeiro, moto e loja no mesmo painel.
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Saldo projetado"
          value={formatCurrencyBRL(finance.projectedCashBalance)}
          detail={`VR: ${formatCurrencyBRL(finance.vrBalance)}`}
          badge={{ text: "Financeiro" }}
        />
        <SummaryCard
          icon={Bike}
          label="Moto no mês"
          value={formatCurrencyBRL(moto.monthlyCost)}
          detail={`Combustível: ${formatCurrencyBRL(moto.fuelCost)}`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
          badge={{ text: "Moto" }}
        />
        <SummaryCard
          icon={Printer}
          label="Loja no mês"
          value={formatCurrencyBRL(store.grossProfit)}
          detail={`Faturamento: ${formatCurrencyBRL(store.revenue)}`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          badge={{ text: "Loja" }}
        />
        <SummaryCard
          icon={PiggyBank}
          label="Consolidado"
          value={formatCurrencyBRL(finance.consolidated.net)}
          detail={`Operacional: ${formatCurrencyBRL(finance.consolidated.operationalExpense)}`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
          badge={{ text: "Geral" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-sm text-zinc-400">Fatura atual</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {formatCurrencyBRL(finance.invoiceTotal)}
              </p>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href="/financeiro">
                Abrir dashboard financeiro
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-sm text-zinc-400">Próximos cuidados</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {moto.reminders.length}
              </p>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href="/moto">
                Abrir módulo da moto
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-sm text-zinc-400">Pedidos em aberto</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {store.openOrders}
              </p>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href="/loja">
                Abrir módulo da loja
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
