"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Boxes, DollarSign, PackageSearch, PaintBucket, Printer, ReceiptText, Sparkles, Zap } from "lucide-react";

import { ChartCard } from "@/components/shared/chart-card";
import { DeltaPill } from "@/components/shared/delta-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { QuickLinkCard } from "@/components/shared/quick-link-card";
import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCompactCurrencyBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatMonthShortLabel,
} from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getStoreDashboardSummary,
  getStoreMonthlyComparison,
  getStoreMonthlyTrend,
  getStoreOperationalHighlights,
} from "@/utils/finance";

export function StorePage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={6} rows={3} />;
  }

  const summary = getStoreDashboardSummary(snapshot, selectedMonth);
  const comparison = getStoreMonthlyComparison(snapshot, selectedMonth);
  const trend = getStoreMonthlyTrend(snapshot, 6);
  const highlights = getStoreOperationalHighlights(snapshot, selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Loja / Impressão 3D</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Operação da Bambu Lab A1 Mini com custo, desperdício e lucro visíveis.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={DollarSign} label="Faturamento" value={formatCurrencyBRL(summary.revenue)} detail={`Lucro bruto: ${formatCurrencyBRL(summary.grossProfit)}`} />
        <SummaryCard icon={Printer} label="Custo" value={formatCurrencyBRL(summary.cost)} detail={`Margem média: ${summary.averageMargin}%`} accent="from-cyan-400/20 via-cyan-500/10 to-transparent" />
        <SummaryCard icon={Boxes} label="Desperdício" value={`${summary.wasteGrams} g`} detail={`${formatCurrencyBRL(summary.wasteCost)} em custo`} accent="from-amber-400/20 via-amber-500/10 to-transparent" />
        <SummaryCard icon={PackageSearch} label="Estoque crítico" value={`${summary.criticalStockCount}`} detail={`${summary.openOrders} pedido(s) em aberto`} accent="from-violet-400/20 via-violet-500/10 to-transparent" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pulso da operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Faturamento</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCompactCurrencyBRL(summary.revenue)}
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.revenue.delta}
                    text={`${comparison.revenue.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                      comparison.revenue.delta,
                    )}`}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Lucro</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCompactCurrencyBRL(summary.grossProfit)}
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.grossProfit.delta}
                    text={`${comparison.grossProfit.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                      comparison.grossProfit.delta,
                    )}`}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Desperdício</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.wasteGrams} g
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.wasteCost.delta}
                    goodWhenPositive={false}
                    text={`${comparison.wasteCost.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                      comparison.wasteCost.delta,
                    )}`}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <p className="text-sm font-medium text-zinc-100">Onde a loja mais está doendo</p>
                <p className="mt-3 font-heading text-2xl font-semibold text-zinc-50">
                  {highlights.topWasteItems[0]?.label ?? "Sem desperdício relevante"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {highlights.topWasteItems[0]
                    ? `${highlights.topWasteItems[0].wasteQuantity} g • ${formatCurrencyBRL(highlights.topWasteItems[0].wasteCost)}`
                    : "Quando houver perda material relevante, ela aparece aqui."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <p className="text-sm font-medium text-zinc-100">Filamento mais puxado</p>
                <p className="mt-3 font-heading text-2xl font-semibold text-zinc-50">
                  {highlights.topFilaments[0]?.label ?? "Sem consumo no período"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {highlights.topFilaments[0]
                    ? `${highlights.topFilaments[0].quantity} g • ${formatCurrencyBRL(highlights.topFilaments[0].totalCost)}`
                    : "Assim que houver produção, o consumo líder aparece aqui."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <QuickLinkCard
            href="/loja/estoque"
            icon={Boxes}
            title="Gerir estoque"
            description="Entrada de filamento, ajustes manuais, insumos e movimentações."
            accent="from-violet-400/20 via-violet-500/10 to-transparent"
          />
          <QuickLinkCard
            href="/loja/catalogo"
            icon={Sparkles}
            title="Curadoria do catálogo"
            description="Filtros por tema, margem, risco de estoque e carrinho para atendimento."
            accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
          />
          <QuickLinkCard
            href="/loja/producao"
            icon={Printer}
            title="Registrar produção"
            description="Atualize custo, energia, desperdício, venda e margem em um fluxo só."
            accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={PaintBucket} label="Pintura / acabamento" value={formatCurrencyBRL(summary.costBreakdown.totalPaintCost)} detail="Insumos de acabamento no período" />
        <SummaryCard icon={Zap} label="Energia" value={formatCurrencyBRL(summary.costBreakdown.totalEnergyCost)} detail="Custo por produção filtrada" accent="from-sky-400/20 via-sky-500/10 to-transparent" />
        <SummaryCard icon={ReceiptText} label="Com lucro" value={`${summary.costBreakdown.profitableCount}`} detail={`${summary.costBreakdown.lossCount} com prejuízo`} accent="from-emerald-400/20 via-emerald-500/10 to-transparent" />
        <SummaryCard icon={Boxes} label="Valor em estoque" value={formatCurrencyBRL(summary.stock.filamentValue + summary.stock.supplyValue)} detail="Saldo atual de filamentos e insumos" accent="from-fuchsia-400/20 via-fuchsia-500/10 to-transparent" />
      </div>

      <ChartCard
        title="Tendência operacional da loja"
        description="Faturamento, custo e lucro bruto lado a lado para enxergar o ritmo da operação."
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trend.map((item) => ({
                month: formatMonthShortLabel(item.month),
                faturamento: item.revenue,
                custo: item.cost,
                lucro: item.profit,
              }))}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip />
              <Bar dataKey="faturamento" fill="#06b6d4" radius={[14, 14, 0, 0]} />
              <Bar dataKey="custo" fill="#f59e0b" radius={[14, 14, 0, 0]} />
              <Bar dataKey="lucro" fill="#10b981" radius={[14, 14, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Produções recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentJobs.length ? (
              summary.recentJobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-50">{job.name}</p>
                      <p className="text-sm text-zinc-400">
                        {formatDateBR(job.date)} • {job.quantityProduced} un • custo unitário {formatCurrencyBRL(job.unitCost)}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Energia {formatCurrencyBRL(job.energyCost)} • Pintura {formatCurrencyBRL(job.paintCost ?? 0)} • Desperdício {formatCurrencyBRL(job.wasteCost)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-50">{formatCurrencyBRL(job.totalCost)}</p>
                      <p className={`text-sm ${job.grossProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrencyBRL(job.grossProfit)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Printer}
                title="Nenhuma produção recente"
                description="Registre a primeira peça para começar a medir custo, desperdício e margem."
              />
            )}
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
            {summary.recentOrders.length ? (
              summary.recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-50">{order.productName}</p>
                      <p className="text-sm text-zinc-400">{formatDateBR(order.date)} • {order.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-50">{formatCurrencyBRL(order.totalPrice)}</p>
                      <p className={`text-sm ${order.grossProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrencyBRL(order.grossProfit)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={ReceiptText}
                title="Nenhum pedido recente"
                description="Cadastre pedidos para acompanhar produção, entrega e lucro snapshot."
              />
            )}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/loja/pedidos">Registrar pedido</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Produtos mais lucrativos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {summary.profitableProducts.length ? (
              summary.profitableProducts.map((item) => (
                <div key={item.productName} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <div>
                    <p className="text-sm text-zinc-100">{item.productName}</p>
                    <p className="text-xs text-zinc-400">Margem {item.marginPercent}%</p>
                  </div>
                  <p className="font-medium text-emerald-300">{formatCurrencyBRL(item.grossProfit)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={DollarSign} title="Sem produtos lucrativos no período" description="Quando houver pedidos entregues com lucro, o ranking aparece aqui." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Produtos com prejuízo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {summary.lossProducts.length ? (
              summary.lossProducts.map((item) => (
                <div key={item.productName} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <div>
                    <p className="text-sm text-zinc-100">{item.productName}</p>
                    <p className="text-xs text-zinc-400">Margem {item.marginPercent}%</p>
                  </div>
                  <p className="font-medium text-rose-300">{formatCurrencyBRL(item.grossProfit)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={PackageSearch} title="Sem prejuízos no período" description="Ótimo sinal: nenhum pedido entregue está aparecendo negativo neste mês." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Estoque crítico</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {summary.stock.criticalSpools.length || summary.stock.criticalSupplies.length ? (
              <>
                {summary.stock.criticalSpools.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-sm text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-400">{item.remainingWeightGrams} g restantes</p>
                  </div>
                ))}
                {summary.stock.criticalSupplies.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-sm text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-400">{item.remainingQuantity} restantes</p>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState icon={Boxes} title="Sem itens críticos" description="O estoque está acima da faixa de alerta por enquanto." />
            )}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/loja/estoque">Abrir estoque</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Breakdown de custo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Energia", summary.costBreakdown.totalEnergyCost],
              ["Pintura", summary.costBreakdown.totalPaintCost],
              ["Outros insumos", summary.costBreakdown.totalOtherSupplyCost],
              ["Acabamento manual", summary.costBreakdown.totalFinishingCost],
              ["Embalagem", summary.costBreakdown.totalPackagingCost],
              ["Custo fixo", summary.costBreakdown.totalFixedCost],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-sm text-zinc-100">{label}</p>
                <p className="font-medium text-zinc-50">{formatCurrencyBRL(Number(value))}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
