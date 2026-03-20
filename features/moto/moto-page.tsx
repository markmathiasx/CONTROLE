"use client";

import * as React from "react";
import type { Route as AppRoute } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeDollarSign,
  Bike,
  CalendarClock,
  CarFront,
  Droplets,
  Gauge,
  Route,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/shared/chart-card";
import { DeltaPill } from "@/components/shared/delta-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { QuickLinkCard } from "@/components/shared/quick-link-card";
import { SummaryCard } from "@/components/shared/summary-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatCompactCurrencyBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatMonthShortLabel,
  formatPercentage,
} from "@/lib/formatters";
import { mergeSearchParams } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getMotoCostByCategory,
  getMotoDashboardSummary,
  getMotoMonthlyComparison,
  getMotoMonthlyTrend,
  getVehiclePerformanceTable,
} from "@/utils/finance";

export function MotoPage() {
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
      router.replace((query ? `${pathname}?${query}` : pathname) as AppRoute, { scroll: false });
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
  const resolvedVehicleScope = selectedVehicle?.id ?? "all";
  const summary = React.useMemo(
    () => (snapshot ? getMotoDashboardSummary(snapshot, selectedMonth, resolvedVehicleScope) : null),
    [resolvedVehicleScope, selectedMonth, snapshot],
  );
  const comparison = React.useMemo(
    () => (snapshot ? getMotoMonthlyComparison(snapshot, selectedMonth, resolvedVehicleScope) : null),
    [resolvedVehicleScope, selectedMonth, snapshot],
  );
  const costByCategory = React.useMemo(
    () => (snapshot ? getMotoCostByCategory(snapshot, selectedMonth, resolvedVehicleScope) : []),
    [resolvedVehicleScope, selectedMonth, snapshot],
  );
  const monthlyTrend = React.useMemo(
    () => (snapshot ? getMotoMonthlyTrend(snapshot, 6, resolvedVehicleScope) : []),
    [resolvedVehicleScope, snapshot],
  );
  const performanceTable = React.useMemo(
    () => (snapshot ? getVehiclePerformanceTable(snapshot, selectedMonth) : []),
    [selectedMonth, snapshot],
  );
  const reportsHref = React.useMemo(() => {
    const query = mergeSearchParams(new URLSearchParams(), {
      tab: "moto",
      vehicle: resolvedVehicleScope === "all" ? null : resolvedVehicleScope,
      period: "month",
      style: "operational",
    });
    return `/relatorios?${query}` as AppRoute;
  }, [resolvedVehicleScope]);
  const vehicleTypeLabel = selectedVehicle?.vehicleType === "car" ? "Carro" : "Moto";

  if (!initialized || !snapshot || !summary || !comparison) {
    return <PageSkeleton cards={5} rows={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Automóvel</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            {selectedVehicle
              ? `${selectedVehicle.nickname} • ${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year}`
              : "Todos os veículos"}
          </h1>
          <p className="text-sm text-zinc-400">
            Custos, litros, serviços e obrigações anuais no mesmo painel.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
          <div className="min-w-[220px]">
            <Select
              value={resolvedVehicleScope}
              onValueChange={(value) => {
                setSelectedVehicleId(value);
                updateQuery({ vehicle: value === "all" ? null : value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um veículo" />
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={selectedVehicle?.vehicleType === "car" ? CarFront : Bike}
          label="Custo do mês"
          value={formatCurrencyBRL(summary.monthlyCost)}
          detail={`Escopo: ${summary.scopeLabel}`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <SummaryCard
          icon={Droplets}
          label="Combustível"
          value={formatCurrencyBRL(summary.fuelCost)}
          detail={`${summary.fuelLiters} L • ${summary.monthlyDistanceKm} km`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={Gauge}
          label="Consumo real"
          value={summary.actualKmPerLiter ? `${summary.actualKmPerLiter} km/L` : "Sem base"}
          detail={`Custo por km: ${formatCurrencyBRL(summary.averageCostPerKm)}`}
          accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
        />
        <SummaryCard
          icon={Wrench}
          label="Manutenção"
          value={formatCurrencyBRL(summary.maintenanceCost)}
          detail={`${summary.reminders.length} cuidado(s) e obrigação(ões)`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
        <SummaryCard
          icon={BadgeDollarSign}
          label="Custos fixos anuais"
          value={formatCurrencyBRL(summary.annualFixedCost)}
          detail={`Reserva mensal ${formatCurrencyBRL(summary.monthlyReserveTarget)}`}
          accent="from-fuchsia-400/20 via-fuchsia-500/10 to-transparent"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pulso do automóvel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Status geral</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.reminders.some((item) => item.isOverdue) ? "Atenção" : "Em dia"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedVehicle
                    ? `${vehicleTypeLabel} ${selectedVehicle.nickname} com ${summary.reminders.length} item(ns) monitorado(s)`
                    : `${summary.vehicles.length} veículo(s) no consolidado com ${summary.reminders.length} item(ns) monitorado(s)`}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Custo</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {formatCompactCurrencyBRL(summary.monthlyCost)}
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.monthlyCost.delta}
                    goodWhenPositive={false}
                    text={`${comparison.monthlyCost.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                      comparison.monthlyCost.delta,
                    )}`}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Distância</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.monthlyDistanceKm} km
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.distanceKm.delta}
                    goodWhenPositive
                    text={`${comparison.distanceKm.delta >= 0 ? "+" : ""}${comparison.distanceKm.delta} km`}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Eficiência</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.actualKmPerLiter ? `${summary.actualKmPerLiter} km/L` : "Sem base"}
                </p>
                <p className="mt-3 text-xs text-zinc-400">
                  {summary.efficiencyDeltaPercent
                    ? `${formatPercentage(summary.efficiencyDeltaPercent)} vs média de cidade`
                    : "Cadastre média do veículo para comparar"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-cyan-300" />
                  <p className="text-sm font-medium text-zinc-100">Odômetro atual</p>
                </div>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50">
                  {summary.lastOdometerKm} km
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Recalculado com base nos registros existentes.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <Route className="size-4 text-emerald-300" />
                  <p className="text-sm font-medium text-zinc-100">Autonomia estimada</p>
                </div>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50">
                  {summary.projectedFullTankRangeKm ? `${summary.projectedFullTankRangeKm} km` : "Sem base"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Baseada no tanque e consumo configurados.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <Droplets className="size-4 text-amber-300" />
                  <p className="text-sm font-medium text-zinc-100">Preço médio / litro</p>
                </div>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50">
                  {formatCurrencyBRL(summary.averagePricePerLiter)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Ticket médio de {formatCurrencyBRL(summary.averageTicket)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-fuchsia-300" />
                  <p className="text-sm font-medium text-zinc-100">Orçamento projetado</p>
                </div>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50">
                  {formatCurrencyBRL(summary.projectedFuelBudget)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Combustível estimado para a meta mensal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <QuickLinkCard
            href="/moto/abastecimentos"
            icon={Droplets}
            title="Novo abastecimento"
            description="Anote litros, preço, posto e odômetro em poucos toques."
            accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
          />
          <QuickLinkCard
            href="/moto/manutencoes"
            icon={Wrench}
            title="Nova manutenção"
            description="Registre revisão, recorrência por km e obrigações sem perder histórico."
            accent="from-amber-400/20 via-amber-500/10 to-transparent"
          />
          <QuickLinkCard
            href={reportsHref}
            icon={CalendarClock}
            title="Fechamento do automóvel"
            description="Abrir relatórios já no escopo atual com foco operacional."
            accent="from-fuchsia-400/20 via-fuchsia-500/10 to-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Evolução mensal do automóvel"
          description="Combustível e manutenção lado a lado para facilitar a leitura do custo real."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrend.map((item) => ({
                  month: formatMonthShortLabel(item.month),
                  combustivel: item.fuelCost,
                  manutencao: item.maintenanceCost,
                }))}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="combustivel" fill="#06b6d4" radius={[12, 12, 0, 0]} />
                <Bar dataKey="manutencao" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Custo por tipo"
          description="Combustível e manutenção por categoria no mês selecionado."
        >
          <div className="space-y-3">
            {costByCategory.length ? (
              costByCategory.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                >
                  <p className="text-sm text-zinc-100">{item.label}</p>
                  <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.total)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Route}
                title="Sem custo neste mês"
                description="Assim que houver gasto com combustível ou manutenção, o breakdown aparece aqui."
              />
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo por veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performanceTable.length ? (
              performanceTable.map((entry) => (
                <div
                  key={entry.vehicleId}
                  className="rounded-2xl border border-white/8 bg-white/6 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-50">{entry.vehicleName}</p>
                      <p className="text-xs text-zinc-400">
                        {entry.vehicleType === "car" ? "Carro" : "Moto"} • {entry.distanceKm} km •{" "}
                        {entry.liters} L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-50">
                        {formatCurrencyBRL(entry.monthlyCost)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {entry.costPerKm ? `${formatCurrencyBRL(entry.costPerKm)}/km` : "Sem custo por km"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Combustível</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">
                        {formatCurrencyBRL(entry.fuelCost)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Manutenção</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">
                        {formatCurrencyBRL(entry.maintenanceCost)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Fixos/ano</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">
                        {formatCurrencyBRL(entry.annualFixedCost)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Alertas</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{entry.reminders}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CarFront}
                title="Sem veículos cadastrados"
                description="Cadastre pelo menos um carro ou moto para ativar o comparativo."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos cuidados e obrigações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.reminders.length ? (
              summary.reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-50">{reminder.title}</p>
                      <p className="text-sm text-zinc-400">
                        {reminder.dueDate ? formatDateBR(reminder.dueDate) : "Sem data"}
                        {reminder.dueKm ? ` • ${reminder.dueKm} km` : ""}
                        {reminder.amount ? ` • ${formatCurrencyBRL(reminder.amount)}` : ""}
                      </p>
                    </div>
                    <Badge variant={reminder.isOverdue ? "danger" : "warning"}>
                      {reminder.isOverdue ? "Atrasado" : "Próximo"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Wrench}
                title="Sem lembretes pendentes"
                description="Defina recorrência por mês, km e custos fixos anuais para acompanhar tudo aqui."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Custos fixos anuais planejados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Reserva mensal sugerida</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-zinc-50">
                {formatCurrencyBRL(summary.monthlyReserveTarget)}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Valor médio para separar todo mês e absorver IPVA, seguro e licenciamento sem susto.
              </p>
            </div>
            {summary.fixedCostCoverageWarnings.length ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Cobertura incompleta</p>
                <div className="mt-2 space-y-2">
                  {summary.fixedCostCoverageWarnings.map((warning) => (
                    <p key={warning.vehicleId} className="text-sm text-amber-50">
                      {warning.message}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            {summary.annualFixedCostItems.length ? (
              summary.annualFixedCostItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-50">{item.title}</p>
                      <p className="text-sm text-zinc-400">{formatDateBR(item.dueDate)}</p>
                    </div>
                    <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={BadgeDollarSign}
                title="Sem custos fixos configurados"
                description="Configure IPVA, seguro e licenciamento nas configurações do veículo."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentMaintenance.length ? (
              summary.recentMaintenance.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-50">{item.description}</p>
                      <p className="text-sm text-zinc-400">
                        {formatDateBR(item.date)} • {item.odometerKm} km
                      </p>
                    </div>
                    <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Wrench}
                title="Sem serviços registrados"
                description="Guarde revisões, troca de óleo e manutenção preventiva neste histórico."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos abastecimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.recentFuelLogs.length ? (
            summary.recentFuelLogs.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-50">{item.station ?? "Abastecimento"}</p>
                    <p className="text-sm text-zinc-400">
                      {formatDateBR(item.date)} • {item.odometerKm} km • {item.liters} L
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                    <p className="text-sm text-zinc-400">
                      {formatCurrencyBRL(item.pricePerLiter)}/L
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Droplets}
              title="Sem abastecimentos recentes"
              description="O primeiro registro já atualiza consumo real, custo por km e preço médio."
            />
          )}

          <Button asChild variant="secondary" className="w-full rounded-2xl">
            <Link href="/moto/abastecimentos">Registrar abastecimento</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
