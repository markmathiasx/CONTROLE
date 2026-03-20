"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Landmark,
  PiggyBank,
  Repeat,
  Sparkles,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

import { BudgetProgressCard } from "@/components/shared/budget-progress-card";
import { ChartCard } from "@/components/shared/chart-card";
import { DeltaPill } from "@/components/shared/delta-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceSummaryCard } from "@/components/shared/invoice-summary-card";
import { LoadingCard } from "@/components/shared/loading-card";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { QuickAddWidget } from "@/components/shared/quick-add-widget";
import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCompactCurrencyBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatMonthShortLabel,
  formatPercentage,
} from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getAlerts,
  getAutomationFeed,
  getBudgetUsage,
  getConsolidatedMonthlyTrend,
  getDashboardSummary,
  getExpenseHighlights,
  getMonthlyComparisons,
  getProjectionMonths,
  getRecurrenceInsights,
  getUpcomingDueItems,
} from "@/utils/finance";

const chartLoading = () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />;

const PaymentMethodBarChart = dynamic(
  () =>
    import("@/features/dashboard/charts/payment-method-bar-chart").then(
      (module) => module.PaymentMethodBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const TopCategoriesPieChart = dynamic(
  () =>
    import("@/features/dashboard/charts/top-categories-pie-chart").then(
      (module) => module.TopCategoriesPieChart,
    ),
  { ssr: false, loading: chartLoading },
);

const SpendByCenterBarChart = dynamic(
  () =>
    import("@/features/dashboard/charts/spend-by-center-bar-chart").then(
      (module) => module.SpendByCenterBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ProjectionStackedBarChart = dynamic(
  () =>
    import("@/features/dashboard/charts/projection-stacked-bar-chart").then(
      (module) => module.ProjectionStackedBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

const ConsolidatedTrendBarChart = dynamic(
  () =>
    import("@/features/dashboard/charts/consolidated-trend-bar-chart").then(
      (module) => module.ConsolidatedTrendBarChart,
    ),
  { ssr: false, loading: chartLoading },
);

export function DashboardPage() {
  const initialized = useFinanceStore((state) => state.initialized);
  const snapshot = useFinanceStore((state) => state.snapshot);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const metrics = React.useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return {
      summary: getDashboardSummary(snapshot, selectedMonth),
      alerts: getAlerts(snapshot, selectedMonth),
      budgetUsage: getBudgetUsage(snapshot, selectedMonth),
      upcoming: getUpcomingDueItems(snapshot, selectedMonth),
      projection: getProjectionMonths(snapshot, selectedMonth, 3),
      highlights: getExpenseHighlights(snapshot, selectedMonth),
      automationFeed: getAutomationFeed(snapshot, selectedMonth, 6),
      recurrenceInsights: getRecurrenceInsights(snapshot, selectedMonth),
      monthlyComparisons: getMonthlyComparisons(snapshot, selectedMonth),
      consolidatedTrend: getConsolidatedMonthlyTrend(snapshot, 6),
    };
  }, [selectedMonth, snapshot]);

  if (!initialized || !snapshot || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    );
  }

  const {
    summary,
    alerts,
    budgetUsage,
    upcoming,
    projection,
    highlights,
    automationFeed,
    recurrenceInsights,
    monthlyComparisons,
    consolidatedTrend,
  } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Painel do mês</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Visão clara do agora e do que já vem pela frente.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={PiggyBank}
          label="Saldo disponível"
          value={formatCurrencyBRL(summary.projectedCashBalance)}
          detail={`Caixa: ${formatCurrencyBRL(summary.cashBalance)}`}
          accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
          badge={{
            text: summary.projectedCashBalance < 0 ? "Crítico" : "Projetado",
            tone: summary.projectedCashBalance < 0 ? "danger" : "default",
          }}
        />
        <SummaryCard
          icon={UtensilsCrossed}
          label="Saldo VR"
          value={formatCurrencyBRL(summary.vrBalance)}
          detail={`Entrou ${formatCurrencyBRL(summary.vrIncome)}`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          badge={{
            text: summary.vrBalance <= snapshot.settings.vrMonthly * 0.15 ? "Baixo" : "Saudável",
            tone: summary.vrBalance <= snapshot.settings.vrMonthly * 0.15 ? "warning" : "default",
          }}
        />
        <SummaryCard
          icon={CreditCard}
          label="Fatura atual"
          value={formatCurrencyBRL(summary.invoiceTotal)}
          detail={`Crédito no mês: ${formatCurrencyBRL(summary.creditExpenses)}`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Parcelas futuras"
          value={formatCurrencyBRL(summary.futureInstallments)}
          detail={`Gasto total: ${formatCurrencyBRL(summary.totalSpent)}`}
          accent="from-sky-400/20 via-sky-500/10 to-transparent"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Estado do mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {monthlyComparisons.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                    {formatCompactCurrencyBRL(item.current)}
                  </p>
                  <div className="mt-3">
                    <DeltaPill
                      delta={item.delta}
                      goodWhenPositive={item.id === "income" || item.id === "net"}
                      text={`${item.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                        item.delta,
                      )} • ${formatPercentage(item.deltaPercent)}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <div className="flex items-center gap-2">
                  <WalletCards className="size-4 text-emerald-300" />
                  <p className="text-sm font-medium text-zinc-100">Pessoal</p>
                </div>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCurrencyBRL(summary.consolidated.personalExpense)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">Despesas fora da operação</p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-amber-300" />
                  <p className="text-sm font-medium text-zinc-100">Operacional</p>
                </div>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCurrencyBRL(summary.consolidated.operationalExpense)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">Automóvel e loja sem misturar no caixa</p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="size-4 text-cyan-300" />
                  <p className="text-sm font-medium text-zinc-100">Receita operacional</p>
                </div>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCurrencyBRL(summary.consolidated.operationalIncome)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">Entradas da loja reconhecidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ChartCard
          title="Saída por forma de pagamento"
          description="Ajuda a entender o peso no caixa, no VR e no crédito."
        >
          {summary.spendByPaymentMethod.length ? (
            <div className="space-y-4">
              <div className="h-72">
                <PaymentMethodBarChart
                  data={summary.spendByPaymentMethod.map((item) => ({
                    name: item.label,
                    total: item.total,
                  }))}
                />
              </div>
              <Button asChild variant="secondary" className="w-full rounded-2xl">
                <Link href="/transacoes" prefetch={false}>Abrir histórico completo</Link>
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={WalletCards}
              title="Nenhum gasto lançado"
              description="Assim que você registrar saídas, o mix de pagamento aparece aqui."
            />
          )}
        </ChartCard>
      </div>

      <QuickAddWidget />

      {alerts.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-white/8">
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`rounded-2xl p-3 ${alert.tone === "critical" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300"}`}
                >
                  <AlertTriangle className="size-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-50">{alert.title}</p>
                    <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      {alert.module}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{alert.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ChartCard
          title="Comparativo com o mês anterior"
          description="Receita, despesa, saldo líquido e fatura lado a lado."
        >
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
                      item.delta < 0 ? "text-emerald-300" : item.id === "income" ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {item.delta === 0
                      ? "Sem mudança"
                      : `${item.delta > 0 ? "+" : ""}${formatCurrencyBRL(item.delta)}`}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-zinc-400">
                  <div>
                    <p>Atual</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {formatCurrencyBRL(item.current)}
                    </p>
                  </div>
                  <div>
                    <p>Anterior</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {formatCurrencyBRL(item.previous)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Agenda automática"
          description="Recorrências, manutenção e reposição que merecem atenção."
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Recorrências</p>
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

            {automationFeed.length ? (
              automationFeed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                        {item.module}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{item.body}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.date ? (
                      <p className="text-xs text-zinc-400">{formatDateBR(item.date)}</p>
                    ) : item.dueKm ? (
                      <p className="text-xs text-zinc-400">{item.dueKm} km</p>
                    ) : (
                      <Sparkles className="size-4 text-zinc-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Repeat}
                title="Tudo sob controle"
                description="Nenhuma rotina importante exige atenção imediata neste período."
              />
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard
          title="Categorias que mais pesaram"
          description="Visão por competência do mês selecionado."
        >
          {summary.topCategories.length ? (
            <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="h-64">
                <TopCategoriesPieChart
                  data={summary.topCategories.map((item) => ({
                    name: item.category?.name ?? "Categoria",
                    value: item.total,
                    color: item.category?.color ?? "#10b981",
                  }))}
                />
              </div>
              <div className="space-y-3">
                {summary.topCategories.map((item) => (
                  <div
                    key={item.category?.id ?? item.total}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: item.category?.color ?? "#10b981" }}
                      />
                      <p className="text-sm text-zinc-200">{item.category?.name}</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCompactCurrencyBRL(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={PiggyBank}
              title="Sem gasto suficiente para ranking"
              description="As categorias mais pesadas aparecem assim que houver movimentação no período."
            />
          )}
        </ChartCard>

        <ChartCard title="Gasto por centro" description="Quem puxou mais o mês até aqui.">
          <div className="h-72">
            <SpendByCenterBarChart
              data={summary.spendByCenter.map((item) => ({
                name: item.center?.name ?? "Centro",
                total: item.total,
                fill: item.center?.color ?? "#10b981",
              }))}
            />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length ? (
              upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-50">{item.description}</p>
                    <p className="text-sm text-zinc-400">{formatDateBR(item.date)}</p>
                  </div>
                  <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.amount)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Nenhum vencimento próximo"
                description="Quando houver contas, recorrências ou faturas chegando, elas aparecem aqui."
              />
            )}
          </CardContent>
        </Card>

        <ChartCard title="Projeção dos próximos 3 meses" description="Comprometimento monetário estimado.">
          <div className="h-72">
            <ProjectionStackedBarChart
              data={projection.map((item) => ({
                month: formatMonthShortLabel(item.month),
                comprometido: item.committed,
                restante: Math.max(item.remaining, 0),
              }))}
            />
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Consolidado dos últimos meses"
        description="Receita, despesa operacional e saldo líquido no mesmo trilho."
      >
        <div className="h-80">
          <ConsolidatedTrendBarChart
            data={consolidatedTrend.map((item) => ({
              month: formatMonthShortLabel(item.month),
              receita: item.income,
              operacional: item.operationalExpense,
              saldo: item.net,
            }))}
          />
        </div>
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Faturas do mês</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {summary.invoices.length ? (
              summary.invoices.map((invoice) => (
                <InvoiceSummaryCard
                  key={invoice.cardId}
                  invoice={invoice}
                  card={snapshot.cards.find((card) => card.id === invoice.cardId)}
                />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  icon={CreditCard}
                  title="Sem faturas neste mês"
                  description="Compras no crédito e parcelas futuras passam a aparecer aqui automaticamente."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recortes rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Cigarro</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {formatCurrencyBRL(highlights.smoke)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Bebidas</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {formatCurrencyBRL(highlights.drinks)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ervas</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {formatCurrencyBRL(highlights.weeds)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">VR usado</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                {formatCurrencyBRL(highlights.vr)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {budgetUsage.length ? (
          budgetUsage.slice(0, 6).map((item) => (
            <BudgetProgressCard
              key={item.budget.id}
              title={item.category?.name ?? "Categoria"}
              spent={item.spent}
              limit={item.budget.limit}
              percentage={item.percentage}
              status={item.status}
            />
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={PiggyBank}
              title="Sem orçamentos configurados"
              description="Crie limites por categoria para acompanhar alerta, consumo e disciplina do mês."
              action={
                <Button asChild variant="secondary" className="rounded-2xl">
                  <Link href="/orcamentos" prefetch={false}>Abrir orçamentos</Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
