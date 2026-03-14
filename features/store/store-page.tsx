"use client";

import Link from "next/link";
import { Boxes, DollarSign, PackageSearch, Printer } from "lucide-react";

import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import { getStoreDashboardSummary } from "@/utils/finance";

export function StorePage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);

  if (!initialized || !snapshot) {
    return null;
  }

  const summary = getStoreDashboardSummary(snapshot, selectedMonth);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Loja / Impressão 3D</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Operação da Bambu Lab A1 Mini em um só lugar.
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={DollarSign}
          label="Faturamento"
          value={formatCurrencyBRL(summary.revenue)}
          detail={`Lucro: ${formatCurrencyBRL(summary.grossProfit)}`}
        />
        <SummaryCard
          icon={Printer}
          label="Custo"
          value={formatCurrencyBRL(summary.cost)}
          detail={`Margem média: ${summary.averageMargin}%`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={Boxes}
          label="Desperdício"
          value={`${summary.wasteGrams} g`}
          detail={`${formatCurrencyBRL(summary.wasteCost)} em custo`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <SummaryCard
          icon={PackageSearch}
          label="Estoque crítico"
          value={`${summary.criticalStockCount}`}
          detail={`${summary.openOrders} pedido(s) em aberto`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produções recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-50">{job.name}</p>
                    <p className="text-sm text-zinc-400">
                      {formatDateBR(job.date)} • {job.quantityProduced} un
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-50">{formatCurrencyBRL(job.totalCost)}</p>
                </div>
              </div>
            ))}
            <Button asChild variant="ghost" className="w-full rounded-2xl">
              <Link href="/loja/estoque">Abrir estoque</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/loja/producao">Registrar produção</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-50">{order.productName}</p>
                    <p className="text-sm text-zinc-400">
                      {formatDateBR(order.date)} • {order.status}
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-50">{formatCurrencyBRL(order.totalPrice)}</p>
                </div>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/loja/pedidos">Registrar pedido</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
