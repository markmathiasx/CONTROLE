"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bike, CalendarClock, Droplets, Gauge, Route, Wrench } from "lucide-react";

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
import { formatCompactCurrencyBRL, formatCurrencyBRL, formatDateBR, formatMonthShortLabel } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getMotoCostByCategory,
  getMotoDashboardSummary,
  getMotoMonthlyComparison,
  getMotoMonthlyTrend,
} from "@/utils/finance";

export function MotoPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={4} rows={3} />;
  }

  const vehicle = snapshot.vehicles[0];
  const summary = getMotoDashboardSummary(snapshot, selectedMonth);
  const comparison = getMotoMonthlyComparison(snapshot, selectedMonth);
  const costByCategory = getMotoCostByCategory(snapshot, selectedMonth);
  const monthlyTrend = getMotoMonthlyTrend(snapshot, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Moto</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            {vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "Controle operacional da moto"}
          </h1>
          <p className="text-sm text-zinc-400">
            Custos, litros, serviços e próximos cuidados no mesmo painel.
          </p>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Bike}
          label="Custo do mês"
          value={formatCurrencyBRL(summary.monthlyCost)}
          detail={`Odômetro atual: ${summary.lastOdometerKm} km`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <SummaryCard
          icon={Droplets}
          label="Combustível"
          value={formatCurrencyBRL(summary.fuelCost)}
          detail={`${summary.fuelLiters} L no mês`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={Gauge}
          label="Preço médio / litro"
          value={formatCurrencyBRL(summary.averagePricePerLiter)}
          detail={`Ticket médio: ${formatCurrencyBRL(summary.averageTicket)}`}
          accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
        />
        <SummaryCard
          icon={Wrench}
          label="Manutenção"
          value={formatCurrencyBRL(summary.maintenanceCost)}
          detail={`${summary.reminders.length} próximo(s) cuidado(s)`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pulso da moto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Status geral</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.reminders.some((item) => item.isOverdue) ? "Atenção" : "Em dia"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {summary.reminders.length
                    ? `${summary.reminders.length} cuidado(s) monitorado(s)`
                    : "Nenhum cuidado recorrente configurado ainda"}
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
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Litros</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.fuelLiters} L
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.liters.delta}
                    goodWhenPositive={false}
                    text={`${comparison.liters.delta >= 0 ? "+" : ""}${comparison.liters.delta} L`}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Serviços</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">
                  {summary.recentMaintenance.length}
                </p>
                <div className="mt-3">
                  <DeltaPill
                    delta={comparison.maintenanceCost.delta}
                    goodWhenPositive={false}
                    text={`${comparison.maintenanceCost.delta >= 0 ? "+" : ""}${formatCompactCurrencyBRL(
                      comparison.maintenanceCost.delta,
                    )}`}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-cyan-300" />
                  <p className="text-sm font-medium text-zinc-100">Odômetro atual</p>
                </div>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50">
                  {summary.lastOdometerKm} km
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Baseado no último abastecimento e nos registros de manutenção.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-amber-300" />
                  <p className="text-sm font-medium text-zinc-100">Categoria mais pesada</p>
                </div>
                <p className="mt-3 font-heading text-2xl font-semibold text-zinc-50">
                  {costByCategory[0]?.label ?? "Sem custo"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {costByCategory[0]
                    ? `${formatCurrencyBRL(costByCategory[0].total)} no período`
                    : "Assim que houver custo, o ranking aparece aqui."}
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
            description="Registre troca de óleo, oficina e recorrência sem perder o histórico."
            accent="from-amber-400/20 via-amber-500/10 to-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Evolução mensal da moto"
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
          description="Combustível entra junto da manutenção para deixar claro onde a moto mais pesa."
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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
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
                description="O primeiro registro já atualiza custo, litros e ticket médio da moto."
              />
            )}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/moto/abastecimentos">Registrar abastecimento</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos cuidados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.reminders.length ? (
              summary.reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-50">{reminder.title}</p>
                      <p className="text-sm text-zinc-400">
                        {reminder.dueDate ? formatDateBR(reminder.dueDate) : "Sem data"}{" "}
                        {reminder.dueKm ? `• ${reminder.dueKm} km` : ""}
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
                description="Defina recorrência por mês ou km nas manutenções para acompanhar tudo aqui."
              />
            )}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/moto/manutencoes">Registrar manutenção</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-50">{item.description}</p>
                      {item.reminder ? (
                        <Badge variant={item.reminder.isOverdue ? "danger" : "warning"}>
                          {item.reminder.isOverdue ? "Revisar agora" : "Agendado"}
                        </Badge>
                      ) : null}
                    </div>
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
              icon={Route}
              title="Sem serviços registrados"
              description="Guarde revisões, troca de óleo e cuidados futuros para não perder o timing."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
