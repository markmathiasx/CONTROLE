"use client";

import * as React from "react";
import { Repeat, Sparkles, TrendingUp, Wallet, Wrench, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/shared/chart-card";
import { DeltaPill } from "@/components/shared/delta-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCompactCurrencyBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatMonthShortLabel,
  formatPercentage,
} from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getAutomationFeed,
  getConsolidatedMonthlyTrend,
  calculateMaintenanceTotals,
  getConsolidatedSummary,
  getExpenseHighlights,
  getFutureInstallmentsByMonth,
  getMotoFuelInsights,
  getMotoCostByCategory,
  getMotoMonthlyTrend,
  getMotoUpcomingReminders,
  getMonthlyComparisons,
  getMonthlyEvolution,
  getProfitByProduct,
  getRecurrenceInsights,
  getStoreConsumptionByFilament,
  getSpendByCategory,
  getSpendByCenter,
  getSpendByPaymentMethod,
  getStoreDashboardSummary,
  getStoreMonthlyTrend,
  getStoreProductionInsights,
  getStoreWasteByItem,
} from "@/utils/finance";

export function ReportsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const reportData = React.useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return {
      highlights: getExpenseHighlights(snapshot, selectedMonth),
      paymentMethodData: getSpendByPaymentMethod(snapshot, selectedMonth),
      centerData: getSpendByCenter(snapshot, selectedMonth),
      categoryData: getSpendByCategory(snapshot, selectedMonth).slice(0, 8),
      monthlyEvolution: getMonthlyEvolution(snapshot, 6),
      futureInstallments: getFutureInstallmentsByMonth(snapshot, selectedMonth, 6),
      fuel: getMotoFuelInsights(snapshot, selectedMonth),
      maintenance: calculateMaintenanceTotals(snapshot, selectedMonth),
      motoTrend: getMotoMonthlyTrend(snapshot, 6),
      motoCostByCategory: getMotoCostByCategory(snapshot, selectedMonth),
      motoReminders: getMotoUpcomingReminders(snapshot, 5),
      store: getStoreDashboardSummary(snapshot, selectedMonth),
      storeInsights: getStoreProductionInsights(snapshot, selectedMonth),
      storeMonthlyTrend: getStoreMonthlyTrend(snapshot, 6),
      consolidated: getConsolidatedSummary(snapshot, selectedMonth),
      consolidatedTrend: getConsolidatedMonthlyTrend(snapshot, 6),
      monthlyComparisons: getMonthlyComparisons(snapshot, selectedMonth),
      recurrenceInsights: getRecurrenceInsights(snapshot, selectedMonth),
      automationFeed: getAutomationFeed(snapshot, selectedMonth, 6),
      profitByProduct: getProfitByProduct(snapshot, selectedMonth).slice(0, 6),
      filamentConsumption: getStoreConsumptionByFilament(snapshot, selectedMonth).slice(0, 6),
      wasteByItem: getStoreWasteByItem(snapshot, selectedMonth).slice(0, 6),
    };
  }, [selectedMonth, snapshot]);

  if (!initialized || !snapshot || !reportData) {
    return <PageSkeleton cards={4} rows={3} />;
  }

  const {
    highlights,
    paymentMethodData,
    centerData,
    categoryData,
    monthlyEvolution,
    futureInstallments,
    fuel,
    maintenance,
    motoTrend,
    motoCostByCategory,
    motoReminders,
    store,
    storeInsights,
    storeMonthlyTrend,
    consolidated,
    consolidatedTrend,
    monthlyComparisons,
    recurrenceInsights,
    automationFeed,
    profitByProduct,
    filamentConsumption,
    wasteByItem,
  } = reportData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Relatórios úteis</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Financeiro, moto, loja e consolidado sem misturar tudo.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Saldo líquido"
          value={formatCurrencyBRL(consolidated.net)}
          detail={`Receita ${formatCurrencyBRL(consolidated.incomeTotal)} • despesa ${formatCurrencyBRL(consolidated.expenseTotal)}`}
          badge={{
            text: consolidated.net >= 0 ? "Consolidado" : "Pressão",
            tone: consolidated.net >= 0 ? "default" : "danger",
          }}
        />
        <SummaryCard
          icon={Wrench}
          label="Moto no período"
          value={formatCurrencyBRL(fuel.totalCost + maintenance.totalCost)}
          detail={`${fuel.totalLiters} L • ${motoReminders.length} lembrete(s)`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <SummaryCard
          icon={Zap}
          label="Loja no período"
          value={formatCurrencyBRL(store.grossProfit)}
          detail={`Energia ${formatCurrencyBRL(storeInsights.totalEnergyCost)} • pintura ${formatCurrencyBRL(storeInsights.totalPaintCost)}`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          badge={{
            text: store.grossProfit >= 0 ? "Operação" : "Prejuízo",
            tone: store.grossProfit >= 0 ? "default" : "danger",
          }}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Agenda automática"
          value={`${automationFeed.length}`}
          detail={`${recurrenceInsights.activeRules} recorrência(s) ativa(s)`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="moto">Moto</TabsTrigger>
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-100">Leitura rápida do financeiro</p>
                  <p className="text-sm text-zinc-400">
                    Este recorte ajuda a enxergar o que mudou no mês atual sem depender de procurar
                    os números em vários blocos.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {monthlyComparisons.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                      <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                        {formatCompactCurrencyBRL(item.current)}
                      </p>
                      <div className="mt-3">
                        <DeltaPill
                          delta={item.delta}
                          goodWhenPositive={item.id === "income" || item.id === "net"}
                          text={`${item.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(item.delta)} • ${formatPercentage(item.deltaPercent)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ChartCard
              title="Sinais rápidos"
              description="Destaques que costumam orientar decisão mais rápido."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Cigarro", highlights.smoke],
                  ["Bebidas", highlights.drinks],
                  ["Ervas", highlights.weeds],
                  ["VR usado", highlights.vr],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                    <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                      {formatCurrencyBRL(Number(value))}
                    </p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Cigarro", highlights.smoke],
              ["Bebidas", highlights.drinks],
              ["Ervas", highlights.weeds],
              ["Crédito", highlights.credit],
              ["VR", highlights.vr],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                  <p className="font-heading text-2xl font-semibold text-zinc-50">
                    {formatCurrencyBRL(Number(value))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Gastos por categoria" description="Top categorias do mês selecionado.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.map((item) => ({ name: item.category?.name ?? "Categoria", total: item.total }))}>
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10b981" radius={[14, 14, 0, 0]}>
                      {categoryData.map((item) => (
                        <Cell key={item.category?.id ?? item.total} fill={item.category?.color ?? "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Gastos por centro" description="Pessoal, casal, moto e loja lado a lado.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centerData.map((item) => ({ name: item.center?.name ?? "Centro", total: item.total }))}>
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#06b6d4" radius={[14, 14, 0, 0]}>
                      {centerData.map((item) => (
                        <Cell key={item.center?.id ?? item.total} fill={item.center?.color ?? "#06b6d4"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Forma de pagamento" description="Como o dinheiro saiu neste mês.">
              <div className="space-y-3">
                {paymentMethodData.map((item) => (
                  <div key={item.paymentMethod} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-sm text-zinc-200">{item.label}</p>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.total)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Parcelas futuras por mês" description="Comprometimento do cartão nos próximos meses.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={futureInstallments.map((item) => ({ month: formatMonthShortLabel(item.month), total: item.total }))}>
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Comparativo mensal do financeiro" description="Receita, gasto e fatura nos últimos meses.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyEvolution.map((item) => ({
                      month: formatMonthShortLabel(item.month),
                      receita: item.income,
                      gasto: item.spent,
                      fatura: item.invoice,
                    }))}
                  >
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} />
                    <Line type="monotone" dataKey="gasto" stroke="#06b6d4" strokeWidth={3} />
                    <Line type="monotone" dataKey="fatura" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Recorrências e automações" description="Rotinas financeiras que já entram na projeção.">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Ativas</p>
                    <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                      {recurrenceInsights.activeRules}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Próximas</p>
                    <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                      {recurrenceInsights.upcomingCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Encerrando</p>
                    <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                      {recurrenceInsights.endingSoonCount}
                    </p>
                  </div>
                </div>

                {automationFeed.filter((item) => item.module === "finance").length ? (
                  automationFeed
                    .filter((item) => item.module === "finance")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-zinc-100">{item.title}</p>
                          <p className="text-xs text-zinc-400">{item.body}</p>
                        </div>
                        {item.date ? (
                          <p className="text-xs text-zinc-400">{formatDateBR(item.date)}</p>
                        ) : null}
                      </div>
                    ))
                ) : (
                  <EmptyState
                    icon={Repeat}
                    title="Sem rotinas pendentes"
                    description="As recorrências financeiras do período estão sob controle."
                  />
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="moto" className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Leitura rápida</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {motoReminders.some((item) => item.isOverdue) ? "Moto pedindo atenção" : "Moto sob controle"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {motoReminders.length
                    ? `${motoReminders.length} lembrete(s) ativos e custo de ${formatCurrencyBRL(fuel.totalCost + maintenance.totalCost)} no período`
                    : "Sem lembretes ativos no recorte selecionado."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Combustível</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCompactCurrencyBRL(fuel.totalCost)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Manutenção</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCompactCurrencyBRL(maintenance.totalCost)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Odômetro</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{fuel.lastOdometerKm} km</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Gasolina</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.totalCost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Litros</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{fuel.totalLiters} L</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Manutenção</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(maintenance.totalCost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Preço médio / L</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.averagePricePerLiter)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ticket médio</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.averageTicket)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Odômetro</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{fuel.lastOdometerKm} km</p></CardContent></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Abastecimentos" description="Histórico do período.">
              <div className="space-y-3">
                {fuel.logs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.station ?? "Abastecimento"}</p>
                      <p className="text-xs text-zinc-400">{item.date} • {item.odometerKm} km</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Manutenção por categoria" description="Onde a moto mais consumiu.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={motoCostByCategory.map((item) => ({
                      name: item.label,
                      total: item.total,
                    }))}
                  >
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#f59e0b" radius={[14, 14, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Evolução mensal da moto" description="Combustível e manutenção dos últimos meses.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={motoTrend.map((item) => ({ month: formatMonthShortLabel(item.month), combustivel: item.fuelCost, manutencao: item.maintenanceCost }))}>
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="combustivel" fill="#06b6d4" radius={[14, 14, 0, 0]} />
                    <Bar dataKey="manutencao" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Próximos cuidados" description="Lembretes derivados das recorrências por tempo ou quilometragem.">
              <div className="space-y-3">
                {motoReminders.length ? motoReminders.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-400">{item.dueDate ? formatDateBR(item.dueDate) : "Sem data"} {item.dueKm ? `• ${item.dueKm} km` : ""}</p>
                    </div>
                    <p className={`text-sm font-medium ${item.isOverdue ? "text-rose-300" : "text-amber-300"}`}>{item.isOverdue ? "Atrasado" : "Próximo"}</p>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-400">Nenhum lembrete ativo no momento.</p>
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="loja" className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Leitura rápida</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {store.grossProfit >= 0 ? "Operação saudável" : "Operação no vermelho"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {store.openOrders} pedido(s) em aberto, {store.criticalStockCount} item(ns) críticos e {formatCurrencyBRL(store.wasteCost)} em desperdício.
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Lucro</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCompactCurrencyBRL(store.grossProfit)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Energia</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCompactCurrencyBRL(storeInsights.totalEnergyCost)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Pintura</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCompactCurrencyBRL(storeInsights.totalPaintCost)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Faturamento</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(store.revenue)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Custo</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(store.cost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Lucro</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(store.grossProfit)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Margem</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{store.averageMargin}%</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Desperdício</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{store.wasteGrams} g</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Estoque crítico</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{store.criticalStockCount}</p></CardContent></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Produtos mais lucrativos" description="Lucro por pedido/produto no mês.">
              <div className="space-y-3">
                {profitByProduct.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.productName}</p>
                      <p className="text-xs text-zinc-400">Margem {item.marginPercent}%</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.grossProfit)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Comparativo mensal da loja" description="Faturamento, custo e lucro dos últimos meses.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={storeMonthlyTrend.map((item) => ({
                      month: formatMonthShortLabel(item.month),
                      faturamento: item.revenue,
                      custo: item.cost,
                      lucro: item.profit,
                    }))}
                  >
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Line type="monotone" dataKey="faturamento" stroke="#10b981" strokeWidth={3} />
                    <Line type="monotone" dataKey="custo" stroke="#06b6d4" strokeWidth={3} />
                    <Line type="monotone" dataKey="lucro" stroke="#f59e0b" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Consumo por material/cor" description="Filamentos que mais saíram no período.">
              <div className="space-y-3">
                {filamentConsumption.length ? filamentConsumption.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.label}</p>
                      <p className="text-xs text-zinc-400">Desperdício {item.wasteQuantity} g</p>
                    </div>
                    <p className="font-medium text-zinc-50">{item.quantity} g</p>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-400">Sem consumo de filamento no período.</p>
                )}
              </div>
            </ChartCard>
            <ChartCard title="Breakdown de custo produtivo" description="Energia, pintura, insumos e acabamento.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Energia", total: storeInsights.totalEnergyCost },
                      { name: "Pintura", total: storeInsights.totalPaintCost },
                      { name: "Outros insumos", total: storeInsights.totalOtherSupplyCost },
                      { name: "Acabamento", total: storeInsights.totalFinishingCost },
                    ]}
                  >
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#06b6d4" radius={[14, 14, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Desperdício por item" description="Onde o desperdício está virando custo.">
              <div className="space-y-3">
                {wasteByItem.length ? wasteByItem.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.label}</p>
                      <p className="text-xs text-zinc-400">{item.wasteQuantity} g</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.wasteCost)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-400">Sem desperdício registrado no período.</p>
                )}
              </div>
            </ChartCard>
            <ChartCard title="Pedidos com lucro e prejuízo" description="Ranking rápido para tomar decisão sobre preço.">
              <div className="space-y-3">
                {profitByProduct.length ? profitByProduct.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.productName}</p>
                      <p className="text-xs text-zinc-400">Margem {item.marginPercent}%</p>
                    </div>
                    <p className={`font-medium ${item.grossProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrencyBRL(item.grossProfit)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-400">Sem pedidos suficientes para ranking neste período.</p>
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="consolidado" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Receita total</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.incomeTotal)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Despesa total</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.expenseTotal)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Operacional</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.operationalExpense)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Saldo líquido</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.net)}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <ChartCard title="Comparativo mês a mês" description="Receita, gasto e fatura nos últimos meses.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyEvolution.map((item) => ({
                      month: formatMonthShortLabel(item.month),
                      receita: item.income,
                      gasto: item.spent,
                      fatura: item.invoice,
                    }))}
                  >
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} />
                    <Line type="monotone" dataKey="gasto" stroke="#06b6d4" strokeWidth={3} />
                    <Line type="monotone" dataKey="fatura" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Atual vs anterior" description="Mudança real do período selecionado.">
              <div className="space-y-3">
                {monthlyComparisons.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-100">{item.label}</p>
                      <p
                        className={`text-sm font-medium ${
                          item.delta > 0 && item.id !== "income" ? "text-rose-300" : "text-emerald-300"
                        }`}
                      >
                        {item.delta === 0
                          ? "Sem mudança"
                          : `${item.delta > 0 ? "+" : ""}${formatCurrencyBRL(item.delta)}`}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                      {formatCurrencyBRL(item.current)} agora vs {formatCurrencyBRL(item.previous)} no mês anterior
                      {" • "}
                      {formatPercentage(item.deltaPercent)}
                    </p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <ChartCard title="Consolidado geral por módulo" description="Receita e custo pessoal, moto e loja no mesmo horizonte.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consolidatedTrend.map((item) => ({
                      month: formatMonthShortLabel(item.month),
                      pessoal: item.personalExpense,
                      moto: item.motoCost,
                      loja: item.storeProfit,
                    }))}
                  >
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="pessoal" stackId="a" fill="#06b6d4" radius={[14, 14, 0, 0]} />
                    <Bar dataKey="moto" stackId="a" fill="#f59e0b" radius={[14, 14, 0, 0]} />
                    <Bar dataKey="loja" stackId="a" fill="#10b981" radius={[14, 14, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Automações e rotina" description="O que o sistema já consegue antecipar para você.">
              <div className="space-y-3">
                {automationFeed.length ? (
                  automationFeed.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                          {item.module}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{item.body}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Sparkles}
                    title="Sem alertas automáticos"
                    description="Não há rotinas urgentes para o período selecionado."
                  />
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
