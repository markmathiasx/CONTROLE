"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowRight,
  Bike,
  CreditCard,
  PiggyBank,
  ShieldCheck,
  Wallet,
  Wrench,
} from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatCompactCurrencyBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatMonthShortLabel,
} from "@/lib/formatters";
import { mergeSearchParams } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getConsolidatedMonthlyTrend,
  getHubExecutiveSummary,
} from "@/utils/finance";

const HubConsolidatedTrendChart = dynamic(
  () =>
    import("@/features/hub/charts/hub-consolidated-trend-chart").then(
      (module) => module.HubConsolidatedTrendChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-full w-full skeleton-shimmer rounded-2xl" />,
  },
);

function moduleTone(value: number, inverse = false) {
  if (value === 0) {
    return "muted" as const;
  }

  const positiveIsGood = !inverse;
  return positiveIsGood ? (value > 0 ? "default" : "warning") : value > 0 ? "warning" : "default";
}

export function HubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(
    () => searchParams.get("vehicle") ?? "all",
  );

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const query = mergeSearchParams(searchParams, updates);
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const urlVehicle = searchParams.get("vehicle") ?? "all";
    if (urlVehicle !== selectedVehicleId) {
      setSelectedVehicleId(urlVehicle);
    }
  }, [searchParams, selectedVehicleId]);

  React.useEffect(() => {
    if (!snapshot?.vehicles.length) {
      return;
    }

    if (
      selectedVehicleId !== "all" &&
      !snapshot.vehicles.some((vehicle) => vehicle.id === selectedVehicleId)
    ) {
      setSelectedVehicleId("all");
      updateQuery({ vehicle: null });
    }
  }, [selectedVehicleId, snapshot, updateQuery]);

  const selectedVehicle =
    snapshot && selectedVehicleId === "all"
      ? null
      : snapshot?.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
  const executive = React.useMemo(
    () => (snapshot ? getHubExecutiveSummary(snapshot, selectedMonth, selectedVehicle?.id ?? "all") : null),
    [selectedMonth, selectedVehicle?.id, snapshot],
  );
  const consolidatedTrend = React.useMemo(() => (snapshot ? getConsolidatedMonthlyTrend(snapshot, 6) : []), [snapshot]);
  const motoModuleHref = React.useMemo(() => {
    const query = mergeSearchParams(new URLSearchParams(), {
      vehicle: selectedVehicle?.id ?? null,
    });
    return (query ? `/moto?${query}` : "/moto") as Route;
  }, [selectedVehicle?.id]);
  const transactionsHref = React.useMemo(() => {
    const query = mergeSearchParams(new URLSearchParams(), {
      module: "moto",
      vehicle: selectedVehicle?.id ?? null,
      linked: "linked",
    });
    return `/transacoes?${query}` as Route;
  }, [selectedVehicle?.id]);
  const reportsHref = React.useMemo(() => {
    const query = mergeSearchParams(new URLSearchParams(), {
      tab: "consolidado",
      vehicle: selectedVehicle?.id ?? null,
      period: "month",
      style: "operational",
    });
    return `/relatorios?${query}` as Route;
  }, [selectedVehicle?.id]);

  if (!initialized || !snapshot || !executive) {
    return <PageSkeleton cards={6} rows={3} />;
  }

  return (
    <div className="space-y-6">
      <Card className="liquid-shell overflow-hidden">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">Hub consolidado</Badge>
            <Badge variant={executive.pulse.criticalAlerts > 0 ? "danger" : "default"}>
              <ShieldCheck className="mr-1 size-3.5" />
              {executive.pulse.criticalAlerts > 0
                ? `${executive.pulse.criticalAlerts} alerta(s) crítico(s)`
                : "Pulso estável"}
            </Badge>
            <Badge variant="muted">
              {selectedVehicle ? selectedVehicle.nickname : "Todos os veículos"}
            </Badge>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-semibold text-zinc-50 sm:text-4xl">
                O que mais importa está visível em segundos.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                Use este painel como centro de comando: saldo, pressão do cartão, custo do
                automóvel, alertas e atalhos para agir rápido no celular ou no desktop.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="liquid-card rounded-2xl px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Fechamento</p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {executive.finance.projectedCashBalance >= 0
                      ? "Caixa projetado ainda respira neste período."
                      : "Caixa projetado já pede atenção neste período."}
                  </p>
                </div>
                <div className="liquid-card rounded-2xl px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Automóvel</p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {executive.moto.reminders.length
                      ? `${executive.moto.reminders.length} cuidado(s) ativo(s) no radar.`
                      : "Sem pendências críticas do automóvel agora."}
                  </p>
                </div>
                <div className="liquid-card rounded-2xl px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Atalho</p>
                  <p className="mt-2 text-sm text-zinc-100">
                    `Ctrl/Cmd + K` abre o lançamento rápido em qualquer tela.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
              <div className="min-w-[220px]">
                <Select
                  value={selectedVehicle?.id ?? "all"}
                  onValueChange={(value) => {
                    setSelectedVehicleId(value);
                    updateQuery({ vehicle: value === "all" ? null : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escopo do automóvel" />
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
              <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
            </div>
          </div>
        </CardContent>
      </Card>

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
          label="Automóvel no mês"
          value={formatCurrencyBRL(executive.moto.monthlyCost)}
          detail={`${executive.moto.scopeLabel} • ${executive.moto.fuelLiters} L • ${executive.moto.reminders.length} cuidado(s)`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
          badge={{ text: "Automóvel", tone: moduleTone(executive.comparisons.motoCost.delta, true) }}
        />
        <SummaryCard
          icon={Wrench}
          label="Reserva do automóvel"
          value={formatCurrencyBRL(executive.moto.monthlyReserveTarget)}
          detail={`${executive.moto.reminders.length} cuidado(s) ativos`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          badge={{
            text: executive.moto.reminders.some((item) => item.isOverdue) ? "Atenção" : "Reserva",
            tone: executive.moto.reminders.some((item) => item.isOverdue) ? "warning" : "default",
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
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Veículos</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {snapshot.vehicles.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Cuidados</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {executive.moto.reminders.length}
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
            <HubConsolidatedTrendChart
              data={consolidatedTrend.map((item) => ({
                month: formatMonthShortLabel(item.month),
                receita: item.income,
                operacional: item.operationalExpense,
                saldo: item.net,
              }))}
            />
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
          href={transactionsHref}
          icon={Bike}
          title="Filtrar lançamentos do automóvel"
          description="Abra o feed já travado no contexto do veículo selecionado."
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <QuickLinkCard
          href="/moto/manutencoes"
          icon={Wrench}
          title="Abrir cuidados do automóvel"
          description="Ver timeline de serviços, recorrências e pendências do veículo."
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <QuickLinkCard
          href={reportsHref}
          icon={ShieldCheck}
          title="Abrir relatórios"
          description="Ir direto para o fechamento consolidado no escopo atual."
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
              <Link href="/financeiro" prefetch={false}>
                Abrir dashboard financeiro
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automóvel</CardTitle>
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
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Escopo</p>
                <p className="mt-2 font-semibold text-zinc-50">{executive.moto.scopeLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Reserva/mês</p>
                <p className="mt-2 font-semibold text-zinc-50">
                  {formatCurrencyBRL(executive.moto.monthlyReserveTarget)}
                </p>
              </div>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href={motoModuleHref} prefetch={false}>
                Abrir módulo do automóvel
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {executive.moto.fixedCostCoverageWarnings.length ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Cobertura fixa</p>
                <p className="mt-2 text-sm text-amber-50">
                  {executive.moto.fixedCostCoverageWarnings[0]?.message}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Saldo consolidado do período</p>
              <p className="font-heading text-3xl font-semibold text-zinc-50">
                {formatCurrencyBRL(executive.finance.consolidated.net)}
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
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Alertas</p>
                <p className="mt-2 font-semibold text-zinc-50">{executive.pulse.alertCount}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Próximos itens</p>
                <p className="mt-2 font-semibold text-zinc-50">
                  {executive.upcoming.length}
                </p>
              </div>
            </div>
            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href={reportsHref} prefetch={false}>
                Abrir fechamento e relatórios
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos vencimentos e cuidados</CardTitle>
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
              description="As próximas parcelas, vencimentos e cuidados do automóvel vão aparecer aqui assim que exigirem atenção."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
