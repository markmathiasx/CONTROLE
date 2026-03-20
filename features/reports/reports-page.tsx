"use client";

import * as React from "react";
import type { Route } from "next";
import { getYear, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Repeat, Sparkles, TrendingUp, Wallet, Wrench, Zap } from "lucide-react";

import { ChartCard } from "@/components/shared/chart-card";
import { DeltaPill } from "@/components/shared/delta-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCompactCurrencyBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatMonthShortLabel,
  formatPercentage,
} from "@/lib/formatters";
import { mergeSearchParams } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import { toast } from "sonner";
import {
  type PrintableReportStyle,
  type ReportPeriod,
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
  getPrintableSpendingReport,
  getRecurrenceInsights,
  getStoreConsumptionByFilament,
  getSpendByCategory,
  getSpendByCenter,
  getSpendByPaymentMethod,
  getStoreDashboardSummary,
  getVehicleAnnualFixedCostSummary,
  getVehicleFixedCostAgenda,
  getVehiclePerformanceTable,
  getStoreMonthlyTrend,
  getStoreProductionInsights,
  getStoreWasteByItem,
} from "@/utils/finance";

const validPeriods = new Set<ReportPeriod>(["day", "week", "month", "year"]);
const validStyles = new Set<PrintableReportStyle>(["neutral", "economy", "operational"]);
const validTabs = new Set(["financeiro", "moto", "loja", "consolidado"]);

type AiFinancialReview = {
  title: string;
  overview: string;
  riskLevel: "low" | "medium" | "high";
  priorities: Array<{ title: string; reason: string; impact: string }>;
  cuts: Array<{ label: string; reason: string; impact: string }>;
  nextActions: string[];
  caution: string;
};

const chartLoading = () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />;

const ReportsCategoryBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsCategoryBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsCenterBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsCenterBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsFutureInstallmentsBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsFutureInstallmentsBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsMonthlyEvolutionLineChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsMonthlyEvolutionLineChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsMotoCostByCategoryBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsMotoCostByCategoryBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsMotoMonthlyTrendBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsMotoMonthlyTrendBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsStoreMonthlyTrendLineChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsStoreMonthlyTrendLineChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsStoreCostBreakdownBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsStoreCostBreakdownBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ReportsConsolidatedByModuleBarChart = dynamic(
  () =>
    import("@/features/reports/charts/reports-charts").then(
      (module) => module.ReportsConsolidatedByModuleBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

export function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const [activeTab, setActiveTab] = React.useState(() => {
    const value = searchParams.get("tab");
    return value && validTabs.has(value) ? value : "financeiro";
  });
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(
    () => searchParams.get("vehicle") ?? "all",
  );
  const [printPeriod, setPrintPeriod] = React.useState<ReportPeriod>(() => {
    const value = searchParams.get("period");
    return value && validPeriods.has(value as ReportPeriod) ? (value as ReportPeriod) : "month";
  });
  const [printAnchorDate, setPrintAnchorDate] = React.useState(
    () => searchParams.get("anchor") ?? new Date().toISOString().slice(0, 10),
  );
  const [reportStyle, setReportStyle] = React.useState<PrintableReportStyle>(() => {
    const value = searchParams.get("style");
    return value && validStyles.has(value as PrintableReportStyle)
      ? (value as PrintableReportStyle)
      : "neutral";
  });
  const [aiReview, setAiReview] = React.useState<AiFinancialReview | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const query = mergeSearchParams(searchParams, updates);
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const nextTab = searchParams.get("tab");
    const nextVehicle = searchParams.get("vehicle") ?? "all";
    const nextPeriod = searchParams.get("period");
    const nextAnchor = searchParams.get("anchor") ?? new Date().toISOString().slice(0, 10);
    const nextStyle = searchParams.get("style");

    const safeTab = nextTab && validTabs.has(nextTab) ? nextTab : "financeiro";
    const safePeriod =
      nextPeriod && validPeriods.has(nextPeriod as ReportPeriod)
        ? (nextPeriod as ReportPeriod)
        : "month";
    const safeStyle =
      nextStyle && validStyles.has(nextStyle as PrintableReportStyle)
        ? (nextStyle as PrintableReportStyle)
        : "neutral";

    if (safeTab !== activeTab) setActiveTab(safeTab);
    if (nextVehicle !== selectedVehicleId) setSelectedVehicleId(nextVehicle);
    if (safePeriod !== printPeriod) setPrintPeriod(safePeriod);
    if (nextAnchor !== printAnchorDate) setPrintAnchorDate(nextAnchor);
    if (safeStyle !== reportStyle) setReportStyle(safeStyle);
  }, [activeTab, printAnchorDate, printPeriod, reportStyle, searchParams, selectedVehicleId]);

  React.useEffect(() => {
    if (selectedVehicleId !== "all" && snapshot?.vehicles.length) {
      if (!snapshot.vehicles.some((vehicle) => vehicle.id === selectedVehicleId)) {
        setSelectedVehicleId("all");
        updateQuery({ vehicle: null });
      }
    }
  }, [selectedVehicleId, snapshot, updateQuery]);

  const selectedVehicle =
    selectedVehicleId === "all"
      ? null
      : snapshot?.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
  const selectedVehicleScope = selectedVehicle?.id ?? "all";
  const printableReportHref = React.useMemo(() => {
    const params = new URLSearchParams({
      period: printPeriod,
      anchor: printAnchorDate,
      vehicle: selectedVehicleScope,
      style: reportStyle,
    });
    return `/relatorios/imprimir?${params.toString()}`;
  }, [printAnchorDate, printPeriod, reportStyle, selectedVehicleScope]);

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
      fuel: getMotoFuelInsights(snapshot, selectedMonth, selectedVehicleScope),
      maintenance: calculateMaintenanceTotals(snapshot, selectedMonth, selectedVehicleScope),
      motoTrend: getMotoMonthlyTrend(snapshot, 6, selectedVehicleScope),
      motoCostByCategory: getMotoCostByCategory(snapshot, selectedMonth, selectedVehicleScope),
      motoReminders: getMotoUpcomingReminders(snapshot, 8, selectedVehicleScope),
      vehicleFixedCosts: getVehicleFixedCostAgenda(snapshot, selectedMonth, selectedVehicleScope, 12),
      vehicleAnnualFixedCosts: getVehicleAnnualFixedCostSummary(
        snapshot,
        getYear(parseISO(`${selectedMonth}-01`)),
        selectedVehicleScope,
      ),
      vehiclePerformance: getVehiclePerformanceTable(snapshot, selectedMonth),
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
      printableReport: getPrintableSpendingReport(snapshot, {
        anchorDate: printAnchorDate,
        period: printPeriod,
        vehicleId: selectedVehicleScope,
        style: reportStyle,
      }),
    };
  }, [printAnchorDate, printPeriod, reportStyle, selectedMonth, selectedVehicleScope, snapshot]);

  const handleGenerateAiReview = React.useCallback(async () => {
    if (!reportData) {
      return;
    }

    if (!runtimeConfig.hasOpenAI) {
      toast.error("A análise IA só fica disponível quando OPENAI_API_KEY estiver configurada no servidor.");
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/financial-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report: reportData.printableReport,
          monthlyComparisons: reportData.monthlyComparisons.map((item) => ({
            label: item.label,
            current: item.current,
            previous: item.previous,
            delta: item.delta,
            deltaPercent: item.deltaPercent,
          })),
        }),
      });

      const payload = (await response.json()) as
        | { ok: true; review: AiFinancialReview }
        | { ok: false; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Não foi possível gerar a leitura IA." : payload.error);
      }

      setAiReview(payload.review);
      toast.success("Leitura IA gerada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar a leitura IA.";
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  }, [reportData, runtimeConfig.hasOpenAI]);

  React.useEffect(() => {
    setAiReview(null);
  }, [printAnchorDate, printPeriod, reportStyle, selectedVehicleScope]);

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
    vehicleFixedCosts,
    vehicleAnnualFixedCosts,
    vehiclePerformance,
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
    printableReport,
  } = reportData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Relatórios úteis</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Financeiro, automóvel, loja e consolidado sem misturar tudo.
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
          label="Automóvel no período"
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          updateQuery({ tab: value === "financeiro" ? null : value });
        }}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="moto">Automóvel</TabsTrigger>
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
                <ReportsCategoryBarChart
                  data={categoryData.map((item) => ({
                    name: item.category?.name ?? "Categoria",
                    total: item.total,
                    fill: item.category?.color ?? "#10b981",
                  }))}
                />
              </div>
            </ChartCard>

            <ChartCard title="Gastos por centro" description="Pessoal, casal, automóvel e loja lado a lado.">
              <div className="h-72">
                <ReportsCenterBarChart
                  data={centerData.map((item) => ({
                    name: item.center?.name ?? "Centro",
                    total: item.total,
                    fill: item.center?.color ?? "#06b6d4",
                  }))}
                />
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
                <ReportsFutureInstallmentsBarChart
                  data={futureInstallments.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    total: item.total,
                  }))}
                />
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Comparativo mensal do financeiro" description="Receita, gasto e fatura nos últimos meses.">
              <div className="h-72">
                <ReportsMonthlyEvolutionLineChart
                  data={monthlyEvolution.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    receita: item.income,
                    gasto: item.spent,
                    fatura: item.invoice,
                  }))}
                />
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
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">Escopo do automóvel</p>
                <p className="text-sm text-zinc-400">
                  {selectedVehicle
                    ? `${selectedVehicle.nickname} • ${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year}`
                    : `${snapshot.vehicles.length} veículo(s) no consolidado da frota`}
                </p>
              </div>
              <Select
                value={selectedVehicleScope}
                onValueChange={(value) => {
                  setSelectedVehicleId(value);
                  updateQuery({ vehicle: value === "all" ? null : value });
                }}
              >
                <SelectTrigger className="sm:w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {snapshot.vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Leitura rápida</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {motoReminders.some((item) => item.isOverdue) ? "Veículo pedindo atenção" : "Operação em dia"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {motoReminders.length
                    ? `${motoReminders.length} lembrete(s)/obrigação(ões) ativos e custo de ${formatCurrencyBRL(fuel.totalCost + maintenance.totalCost)} no período`
                    : "Sem alertas ativos no recorte selecionado."}
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
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Custos anuais</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCompactCurrencyBRL(vehicleAnnualFixedCosts.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Gasolina</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.totalCost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Litros</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{fuel.totalLiters} L</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Manutenção</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(maintenance.totalCost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Preço médio / L</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.averagePricePerLiter)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ticket médio</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.averageTicket)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Odômetro</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{fuel.lastOdometerKm} km</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Agenda anual</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{vehicleFixedCosts.length}</p></CardContent></Card>
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
            <ChartCard title="Manutenção por categoria" description="Onde o veículo mais consumiu.">
              <div className="h-72">
                <ReportsMotoCostByCategoryBarChart
                  data={motoCostByCategory.map((item) => ({
                    name: item.label,
                    total: item.total,
                  }))}
                />
              </div>
            </ChartCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Comparativo por veículo" description="Custo e eficiência lado a lado para todos os veículos.">
              <div className="space-y-3">
                {vehiclePerformance.map((item) => (
                  <div key={item.vehicleId} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-100">{item.vehicleName}</p>
                        <p className="text-xs text-zinc-400">
                          {item.distanceKm} km • {item.liters} L • {item.kmPerLiter ? `${item.kmPerLiter} km/L` : "sem média"}
                        </p>
                      </div>
                      <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.monthlyCost)}</p>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2"><p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Combustível</p><p className="mt-1 text-sm text-zinc-100">{formatCompactCurrencyBRL(item.fuelCost)}</p></div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2"><p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Manutenção</p><p className="mt-1 text-sm text-zinc-100">{formatCompactCurrencyBRL(item.maintenanceCost)}</p></div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2"><p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Custo/km</p><p className="mt-1 text-sm text-zinc-100">{item.costPerKm ? formatCurrencyBRL(item.costPerKm) : "--"}</p></div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2"><p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Custos anuais</p><p className="mt-1 text-sm text-zinc-100">{formatCompactCurrencyBRL(item.annualFixedCost)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Custos fixos anuais" description="IPVA, seguro e licenciamento já entram na agenda do automóvel.">
              <div className="space-y-3">
                {vehicleFixedCosts.length ? vehicleFixedCosts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-400">{item.dueDate ? formatDateBR(item.dueDate) : "Sem data"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.amount)}</p>
                      <p className={`text-xs ${item.isOverdue ? "text-rose-300" : "text-amber-300"}`}>{item.isOverdue ? "Vencido" : "Programado"}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-400">Sem custos fixos configurados para este recorte.</p>
                )}
              </div>
            </ChartCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Evolução mensal do veículo" description="Combustível e manutenção dos últimos meses.">
              <div className="h-72">
                <ReportsMotoMonthlyTrendBarChart
                  data={motoTrend.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    combustivel: item.fuelCost,
                    manutencao: item.maintenanceCost,
                  }))}
                />
              </div>
            </ChartCard>
            <ChartCard title="Próximos cuidados" description="Lembretes por meses/km e obrigações anuais do automóvel.">
              <div className="space-y-3">
                {motoReminders.length ? motoReminders.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-400">
                        {item.dueDate ? formatDateBR(item.dueDate) : "Sem data"} {item.dueKm ? `• ${item.dueKm} km` : ""} {"amount" in item && item.amount ? `• ${formatCurrencyBRL(item.amount)}` : ""}
                      </p>
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
                <ReportsStoreMonthlyTrendLineChart
                  data={storeMonthlyTrend.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    faturamento: item.revenue,
                    custo: item.cost,
                    lucro: item.profit,
                  }))}
                />
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
                <ReportsStoreCostBreakdownBarChart
                  data={[
                    { name: "Energia", total: storeInsights.totalEnergyCost },
                    { name: "Pintura", total: storeInsights.totalPaintCost },
                    { name: "Outros insumos", total: storeInsights.totalOtherSupplyCost },
                    { name: "Acabamento", total: storeInsights.totalFinishingCost },
                  ]}
                />
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

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Relatório imprimível / PDF</p>
                  <p className="text-sm text-zinc-400">
                    Gere um consolidado em formato de fatura com filtros por período e escopo do automóvel.
                  </p>
                </div>
                <Button asChild className="rounded-2xl">
                  <a href={printableReportHref} target="_blank" rel="noreferrer">
                    Pré-visualizar relatório
                  </a>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "day", label: "Dia" },
                  { value: "week", label: "Semana" },
                  { value: "month", label: "Mês" },
                  { value: "year", label: "Ano" },
                ].map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={printPeriod === item.value ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => {
                      const value = item.value as ReportPeriod;
                      setPrintPeriod(value);
                      updateQuery({ period: value === "month" ? null : value });
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    value={printPeriod}
                    onValueChange={(value) => {
                      setPrintPeriod(value as ReportPeriod);
                      updateQuery({ period: value === "month" ? null : value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data base</Label>
                  <Input
                    type="date"
                    value={printAnchorDate}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPrintAnchorDate(value);
                      updateQuery({ anchor: value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Escopo do automóvel</Label>
                  <Select
                    value={selectedVehicleScope}
                    onValueChange={(value) => {
                      setSelectedVehicleId(value);
                      updateQuery({ vehicle: value === "all" ? null : value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os veículos</SelectItem>
                      {snapshot.vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.nickname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modelo de análise</Label>
                  <Select
                    value={reportStyle}
                    onValueChange={(value) => {
                      setReportStyle(value as PrintableReportStyle);
                      updateQuery({ style: value === "neutral" ? null : value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Equilibrado</SelectItem>
                      <SelectItem value="economy">Economia</SelectItem>
                      <SelectItem value="operational">Operacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Preview</p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(printableReport.totalExpense)}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {printableReport.periodLabel} • saldo {formatCurrencyBRL(printableReport.net)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-3 rounded-[28px] border border-white/8 bg-white/6 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-100">Prévia do relatório</p>
                      <p className="text-sm text-zinc-400">{printableReport.headline}</p>
                    </div>
                    <Badge variant={printableReport.net >= 0 ? "default" : "danger"}>
                      {printableReport.net >= 0 ? "Fechamento positivo" : "Fechamento negativo"}
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Receitas</p>
                      <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(printableReport.totalIncome)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Despesas</p>
                      <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(printableReport.totalExpense)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Automóvel</p>
                      <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(printableReport.automovel.totalCost)}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Maior gasto</p>
                      <p className="mt-2 text-sm font-medium text-zinc-100">
                        {printableReport.biggestExpense?.description ?? "Sem destaque"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {printableReport.biggestExpense
                          ? `${formatDateBR(printableReport.biggestExpense.date)} • ${formatCurrencyBRL(printableReport.biggestExpense.amount)}`
                          : "Nenhuma despesa encontrada no período"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Reserva mensal do automóvel</p>
                      <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                        {formatCurrencyBRL(printableReport.automovel.monthlyReserveTarget)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{printableReport.automovel.scopeLabel}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {printableReport.topCategories.slice(0, 3).map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div>
                          <p className="text-sm text-zinc-100">{item.label}</p>
                          <p className="text-xs text-zinc-400">{Math.round(item.share)}% das despesas</p>
                        </div>
                        <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-[28px] border border-white/8 bg-white/6 p-4">
                  <p className="font-medium text-zinc-100">Recomendações automáticas</p>
                  {printableReport.recommendations.map((recommendation) => (
                    <div key={recommendation} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                      {recommendation}
                    </div>
                  ))}
                  {printableReport.automovel.coverageWarnings.length ? (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-50">
                      {printableReport.automovel.coverageWarnings.join(" ")}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-white/8 bg-white/6 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-zinc-100">Leitura IA opcional</p>
                    <p className="text-sm text-zinc-400">
                      Gera um fechamento comentado com prioridades, cortes sugeridos e próximos passos.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="rounded-2xl"
                    variant={runtimeConfig.hasOpenAI ? "default" : "secondary"}
                    disabled={aiLoading || !runtimeConfig.hasOpenAI}
                    onClick={() => void handleGenerateAiReview()}
                  >
                    {aiLoading ? "Gerando análise..." : "Gerar leitura IA"}
                  </Button>
                </div>

                {!runtimeConfig.hasOpenAI ? (
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-400">
                    Configure `OPENAI_API_KEY` e, se quiser, `OPENAI_RESPONSES_MODEL` no servidor para ativar esta camada.
                  </div>
                ) : null}

                {aiReview ? (
                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-zinc-100">{aiReview.title}</p>
                          <p className="mt-1 text-sm text-zinc-400">{aiReview.overview}</p>
                        </div>
                        <Badge
                          variant={
                            aiReview.riskLevel === "high"
                              ? "danger"
                              : aiReview.riskLevel === "medium"
                                ? "warning"
                                : "default"
                          }
                        >
                          {aiReview.riskLevel === "high"
                            ? "Risco alto"
                            : aiReview.riskLevel === "medium"
                              ? "Risco médio"
                              : "Risco baixo"}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {aiReview.priorities.map((item) => (
                          <div key={item.title} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                            <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                            <p className="mt-1 text-sm text-zinc-400">{item.reason}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">{item.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-zinc-100">Cortes e próximos passos</p>
                      {aiReview.cuts.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                          <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                          <p className="mt-1 text-sm text-zinc-400">{item.reason}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">{item.impact}</p>
                        </div>
                      ))}
                      <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                        <p className="text-sm font-medium text-zinc-100">Próximas ações</p>
                        <div className="mt-2 space-y-2">
                          {aiReview.nextActions.map((item) => (
                            <p key={item} className="text-sm text-zinc-400">
                              • {item}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-50">
                        {aiReview.caution}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <ChartCard title="Comparativo mês a mês" description="Receita, gasto e fatura nos últimos meses.">
              <div className="h-80">
                <ReportsMonthlyEvolutionLineChart
                  data={monthlyEvolution.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    receita: item.income,
                    gasto: item.spent,
                    fatura: item.invoice,
                  }))}
                />
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
            <ChartCard title="Consolidado geral por módulo" description="Receita e custo pessoal, automóvel e loja no mesmo horizonte.">
              <div className="h-80">
                <ReportsConsolidatedByModuleBarChart
                  data={consolidatedTrend.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    pessoal: item.personalExpense,
                    moto: item.motoCost,
                    loja: item.storeProfit,
                  }))}
                />
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
