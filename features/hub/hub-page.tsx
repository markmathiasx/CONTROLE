"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bike,
  Boxes,
  CreditCard,
  PiggyBank,
  Printer,
  ShieldCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { QuickLinkCard } from "@/components/shared/quick-link-card";
import { SummaryCard } from "@/components/shared/summary-card";
import { Badge } from "@/components/ui/badge";
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
  getConsolidatedMonthlyTrend,
  getHubExecutiveSummary,
  getStoreMonthlyTrend,
} from "@/utils/finance";

function moduleTone(value: number, inverse = false) {
  if (value === 0) {
    return "muted" as const;
  }

  const positiveIsGood = !inverse;
  return positiveIsGood ? (value > 0 ? "default" : "warning") : value > 0 ? "warning" : "default";
}

export function HubPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={6} rows={3} />;
  }

  const executive = getHubExecutiveSummary(snapshot, selectedMonth);
  const consolidatedTrend = getConsolidatedMonthlyTrend(snapshot, 6);
  const storeTrend = getStoreMonthlyTrend(snapshot, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">Hub consolidado</Badge>
            <Badge variant={executive.pulse.criticalAlerts > 0 ? "danger" : "default"}>
              <ShieldCheck className="mr-1 size-3.5" />
              {executive.pulse.criticalAlerts > 0
                ? `${executive.pulse.criticalAlerts} alerta(s) crítico(s)`
                : "Pulso estável"}
            </Badge>
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold text-zinc-50 sm:text-4xl">
              O que mais importa está visível em segundos.
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
              Use este painel como centro de comando: saldo, pressão do cartão, custo da moto, lucro
              da loja, alertas e atalhos para agir rápido no celular ou no desktop.
            </p>
          </div>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Saldo projetado"
          value={formatCurrencyBRL(executive.finance.projectedCashBalance)}
          detail={`Fatura: ${formatCurrencyBRL(executive.finance.invoiceTotal)}`}
          badge={{
            text: executive.finance.projectedCashBalance < 0 ? "Atenção" : "Financeiro",
            tone: executive.finance.projectedCashBalance < 0 ? "danger" : "default",
          }}
        />
        <SummaryCard
          icon={Bike}
          label="Moto no mês"
          value={formatCurrencyBRL(executive.moto.monthlyCost)}
          detail={`${executive.moto.fuelLiters} L • ${executive.moto.reminders.length} cuidado(s)`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
          badge={{ text: "Moto", tone: moduleTone(executive.comparisons.motoCost.delta, true) }}
        />
        <SummaryCard
          icon={Printer}
          label="Lucro da loja"
          value={formatCurrencyBRL(executive.store.grossProfit)}
          detail={`Faturamento: ${formatCurrencyBRL(executive.store.revenue)}`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          badge={{
            text: executive.store.grossProfit < 0 ? "Prejuízo" : "Loja",
            tone: executive.store.grossProfit < 0 ? "danger" : "default",
          }}
        />
        <SummaryCard
          icon={PiggyBank}
          label="Consolidado geral"
          value={formatCurrencyBRL(executive.finance.consolidated.net)}
          detail={`Operacional: ${formatCurrencyBRL(executive.finance.consolidated.operationalExpense)}`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
          badge={{ text: "Geral" }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Radar do período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Alertas</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {executive.pulse.alertCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Vencimentos</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {executive.pulse.upcomingDueCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Pedidos abertos</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {executive.pulse.openOrders}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Estoque crítico</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {executive.pulse.criticalStockCount}
                </p>
              </div>
            </div>

            {executive.alerts.length ? (
              <div className="space-y-3">
                {executive.alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-2xl p-2.5 ${
                          alert.tone === "critical"
                            ? "bg-rose-500/10 text-rose-300"
                            : "bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-zinc-100">{alert.title}</p>
                          <Badge variant="muted">{alert.module}</Badge>
                        </div>
                        <p className="text-sm text-zinc-400">{alert.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="Nada gritando por atenção"
                description="Quando houver pressão financeira, manutenção próxima ou risco operacional, o hub avisa aqui."
              />
            )}
          </CardContent>
        </Card>

        <ChartCard
          title="Consolidado dos últimos meses"
          description="Receita, gasto operacional e saldo líquido no mesmo trilho."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={consolidatedTrend.map((item) => ({
                  month: formatMonthShortLabel(item.month),
                  receita: item.income,
                  operacional: item.operationalExpense,
                  saldo: item.net,
                }))}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="receita" fill="#10b981" radius={[14, 14, 0, 0]} />
                <Bar dataKey="operacional" fill="#f59e0b" radius={[14, 14, 0, 0]} />
                <Bar dataKey="saldo" fill="#06b6d4" radius={[14, 14, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLinkCard
          href="/financeiro"
          icon={CreditCard}
          title="Abrir financeiro"
          description="Saldo, cartão, parcelas, orçamentos e visão do mês."
        />
        <QuickLinkCard
          href="/moto/abastecimentos"
          icon={Bike}
          title="Registrar abastecimento"
          description="Anote rápido litros, posto, preço e odômetro."
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <QuickLinkCard
          href="/loja/producao"
          icon={Printer}
          title="Registrar produção"
          description="Custo, energia, desperdício e margem em tempo real."
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <QuickLinkCard
          href="/relatorios"
          icon={Boxes}
          title="Abrir relatórios"
          description="Comparativos, gráficos e consolidados para decidir melhor."
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Saldo projetado do mês</p>
              <p className="font-heading text-3xl font-semibold text-zinc-50">
                {formatCurrencyBRL(executive.finance.projectedCashBalance)}
              </p>
              <DeltaPill
                delta={executive.comparisons.financeProjectedBalance.delta}
                goodWhenPositive
                text={`${executive.comparisons.financeProjectedBalance.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                  executive.comparisons.financeProjectedBalance.delta,
                )} vs mês anterior`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">VR</p>
                <p className="mt-2 font-semibold text-zinc-50">
                  {formatCurrencyBRL(executive.finance.vrBalance)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Fatura</p>
                <p className="mt-2 font-semibold text-zinc-50">
                  {formatCurrencyBRL(executive.finance.invoiceTotal)}
                </p>
              </div>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href="/financeiro">
                Abrir dashboard financeiro
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Custo operacional</p>
              <p className="font-heading text-3xl font-semibold text-zinc-50">
                {formatCurrencyBRL(executive.moto.monthlyCost)}
              </p>
              <DeltaPill
                delta={executive.comparisons.motoCost.delta}
                goodWhenPositive={false}
                text={`${executive.comparisons.motoCost.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                  executive.comparisons.motoCost.delta,
                )} vs mês anterior`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Litros</p>
                <p className="mt-2 font-semibold text-zinc-50">{executive.moto.fuelLiters} L</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Cuidados</p>
                <p className="mt-2 font-semibold text-zinc-50">{executive.moto.reminders.length}</p>
              </div>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href="/moto">
                Abrir módulo da moto
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Lucro bruto entregue</p>
              <p className="font-heading text-3xl font-semibold text-zinc-50">
                {formatCurrencyBRL(executive.store.grossProfit)}
              </p>
              <DeltaPill
                delta={executive.comparisons.storeProfit.delta}
                goodWhenPositive
                text={`${executive.comparisons.storeProfit.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                  executive.comparisons.storeProfit.delta,
                )} vs mês anterior`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Pedidos</p>
                <p className="mt-2 font-semibold text-zinc-50">{executive.store.openOrders}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Estoque crítico</p>
                <p className="mt-2 font-semibold text-zinc-50">
                  {executive.store.criticalStockCount}
                </p>
              </div>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href="/loja">
                Abrir módulo da loja
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ChartCard
          title="Lucro e faturamento da loja"
          description="Leitura rápida do que a operação está entregando mês a mês."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={storeTrend.map((item) => ({
                  month: formatMonthShortLabel(item.month),
                  faturamento: item.revenue,
                  lucro: item.profit,
                }))}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="faturamento" fill="#06b6d4" radius={[14, 14, 0, 0]} />
                <Bar dataKey="lucro" radius={[14, 14, 0, 0]}>
                  {storeTrend.map((item) => (
                    <Cell
                      key={item.month}
                      fill={item.profit >= 0 ? "#10b981" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Próximas entregas e cuidados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {executive.moto.reminders.length || executive.pulse.upcomingDueCount ? (
              <>
                {executive.moto.reminders.slice(0, 3).map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-start justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="size-4 text-amber-300" />
                        <p className="text-sm font-medium text-zinc-100">{reminder.title}</p>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {reminder.dueDate ? formatDateBR(reminder.dueDate) : "Sem data"}{" "}
                        {reminder.dueKm ? `• ${reminder.dueKm} km` : ""}
                      </p>
                    </div>
                    <Badge variant={reminder.isOverdue ? "danger" : "warning"}>
                      {reminder.isOverdue ? "Atrasado" : "Próximo"}
                    </Badge>
                  </div>
                ))}
                {executive.upcoming.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-4 text-cyan-300" />
                        <p className="text-sm font-medium text-zinc-100">{item.description}</p>
                      </div>
                      <p className="text-sm text-zinc-400">{formatDateBR(item.date)}</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.amount)}</p>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="Sem pressão imediata"
                description="As próximas entregas, vencimentos e cuidados vão aparecer aqui assim que exigirem atenção."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
