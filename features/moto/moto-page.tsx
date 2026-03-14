"use client";

import Link from "next/link";
import { Bike, Droplets, Wrench } from "lucide-react";

import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import { getMotoDashboardSummary } from "@/utils/finance";

export function MotoPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);

  if (!initialized || !snapshot) {
    return null;
  }

  const vehicle = snapshot.vehicles[0];
  const summary = getMotoDashboardSummary(snapshot, selectedMonth);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Moto</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          {vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "Controle operacional da moto"}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Bike}
          label="Custo do mês"
          value={formatCurrencyBRL(summary.monthlyCost)}
          detail={`Odômetro atual: ${vehicle?.currentOdometerKm ?? 0} km`}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
        <SummaryCard
          icon={Droplets}
          label="Combustível"
          value={formatCurrencyBRL(summary.fuelCost)}
          detail={`${summary.fuelLiters} L abastecidos`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={Wrench}
          label="Manutenção"
          value={formatCurrencyBRL(summary.maintenanceCost)}
          detail={`${summary.reminders.length} próximo(s) cuidado(s)`}
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos abastecimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentFuelLogs.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-50">{item.station ?? "Abastecimento"}</p>
                    <p className="text-sm text-zinc-400">{formatDateBR(item.date)} • {item.odometerKm} km</p>
                  </div>
                  <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                </div>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/moto/abastecimentos">Registrar abastecimento</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentMaintenance.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-50">{item.description}</p>
                    <p className="text-sm text-zinc-400">{formatDateBR(item.date)} • {item.odometerKm} km</p>
                  </div>
                  <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                </div>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full rounded-2xl">
              <Link href="/moto/manutencoes">Registrar manutenção</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
