"use client";

import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  PiggyBank,
  UtensilsCrossed,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BudgetProgressCard } from "@/components/shared/budget-progress-card";
import { ChartCard } from "@/components/shared/chart-card";
import { InvoiceSummaryCard } from "@/components/shared/invoice-summary-card";
import { LoadingCard } from "@/components/shared/loading-card";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { QuickAddWidget } from "@/components/shared/quick-add-widget";
import { SummaryCard } from "@/components/shared/summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrencyBRL, formatCurrencyBRL, formatDateBR, formatMonthShortLabel } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import { getAlerts, getBudgetUsage, getDashboardSummary, getExpenseHighlights, getProjectionMonths, getUpcomingDueItems } from "@/utils/finance";

export function DashboardPage() {
  const initialized = useFinanceStore((state) => state.initialized);
  const snapshot = useFinanceStore((state) => state.snapshot);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);

  if (!initialized || !snapshot) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    );
  }

  const summary = getDashboardSummary(snapshot, selectedMonth);
  const alerts = getAlerts(snapshot, selectedMonth);
  const budgetUsage = getBudgetUsage(snapshot, selectedMonth);
  const upcoming = getUpcomingDueItems(snapshot, selectedMonth);
  const projection = getProjectionMonths(snapshot, selectedMonth, 3);
  const highlights = getExpenseHighlights(snapshot, selectedMonth);

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
                  <p className="font-medium text-zinc-50">{alert.title}</p>
                  <p className="text-sm text-zinc-400">{alert.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard
          title="Categorias que mais pesaram"
          description="Visão por competência do mês selecionado."
        >
          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.topCategories.map((item) => ({
                      name: item.category?.name ?? "Categoria",
                      value: item.total,
                      color: item.category?.color ?? "#10b981",
                    }))}
                    innerRadius={56}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {summary.topCategories.map((item) => (
                      <Cell
                        key={item.category?.id ?? item.total}
                        fill={item.category?.color ?? "#10b981"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
        </ChartCard>

        <ChartCard title="Gasto por centro" description="Quem puxou mais o mês até aqui.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.spendByCenter.map((item) => ({
                name: item.center?.name ?? "Centro",
                total: item.total,
                fill: item.center?.color ?? "#10b981",
              }))}>
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="total" radius={[18, 18, 4, 4]}>
                  {summary.spendByCenter.map((item) => (
                    <Cell key={item.center?.id ?? item.total} fill={item.center?.color ?? "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((item) => (
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
            ))}
          </CardContent>
        </Card>

        <ChartCard title="Projeção dos próximos 3 meses" description="Comprometimento monetário estimado.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projection.map((item) => ({
                month: formatMonthShortLabel(item.month),
                comprometido: item.committed,
                restante: Math.max(item.remaining, 0),
              }))}>
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="comprometido" stackId="a" fill="#10b981" radius={[18, 18, 0, 0]} />
                <Bar dataKey="restante" stackId="a" fill="#1f2937" radius={[0, 0, 18, 18]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Faturas do mês</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {summary.invoices.map((invoice) => (
              <InvoiceSummaryCard
                key={invoice.cardId}
                invoice={invoice}
                card={snapshot.cards.find((card) => card.id === invoice.cardId)}
              />
            ))}
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
        {budgetUsage.slice(0, 6).map((item) => (
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
    </div>
  );
}
