"use client";

import * as React from "react";
import { Droplets, Fuel, GaugeCircle, Receipt, Route } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { paymentMethodLabels } from "@/lib/constants";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { formatMonthKey } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import type { FuelFilters, FuelLogFormValues } from "@/types/forms";
import { getMotoFuelInsights } from "@/utils/finance";
import { solveFuelValues } from "@/utils/operations";

type FuelFormState = {
  id?: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  totalCost: string;
  pricePerLiter: string;
  liters: string;
  station: string;
  paymentMethod: FuelLogFormValues["paymentMethod"];
  notes: string;
};

const initialForm: FuelFormState = {
  vehicleId: "",
  date: new Date().toISOString().slice(0, 10),
  odometerKm: 0,
  totalCost: "",
  pricePerLiter: "",
  liters: "",
  station: "",
  paymentMethod: "debit",
  notes: "",
};

function toFuelFormState(values?: Partial<FuelLogFormValues> & { id?: string }): FuelFormState {
  return {
    id: values?.id,
    vehicleId: values?.vehicleId ?? "",
    date: values?.date ?? new Date().toISOString().slice(0, 10),
    odometerKm: values?.odometerKm ?? 0,
    totalCost: values?.totalCost ? String(values.totalCost) : "",
    pricePerLiter: values?.pricePerLiter ? String(values.pricePerLiter) : "",
    liters: values?.liters ? String(values.liters) : "",
    station: values?.station ?? "",
    paymentMethod: values?.paymentMethod ?? "debit",
    notes: values?.notes ?? "",
  };
}

function groupByMonth<T extends { date: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const month = formatMonthKey(item.date);
    acc[month] = [...(acc[month] ?? []), item];
    return acc;
  }, {});
}

function FuelLogForm({
  value,
  vehicles,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  value: FuelFormState;
  vehicles: Array<{ id: string; nickname: string }>;
  onChange: React.Dispatch<React.SetStateAction<FuelFormState>>;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const preview =
    Number(value.pricePerLiter) > 0
      ? solveFuelValues({
          totalCost: value.totalCost ? Number(value.totalCost) : undefined,
          liters: value.liters ? Number(value.liters) : undefined,
          pricePerLiter: Number(value.pricePerLiter),
        })
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Veículo</Label>
          <Select
            value={value.vehicleId}
            onValueChange={(next) => onChange((current) => ({ ...current, vehicleId: next }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o veículo" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.nickname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={value.date}
            onChange={(event) => onChange((current) => ({ ...current, date: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Odômetro (km)</Label>
          <Input
            type="number"
            value={value.odometerKm}
            onChange={(event) =>
              onChange((current) => ({ ...current, odometerKm: Number(event.target.value) }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Preço por litro</Label>
          <Input
            type="number"
            step="0.01"
            value={value.pricePerLiter}
            onChange={(event) =>
              onChange((current) => ({ ...current, pricePerLiter: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Valor total</Label>
          <Input
            type="number"
            step="0.01"
            value={value.totalCost}
            onChange={(event) =>
              onChange((current) => ({ ...current, totalCost: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Litros</Label>
          <Input
            type="number"
            step="0.01"
            value={value.liters}
            onChange={(event) => onChange((current) => ({ ...current, liters: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Posto</Label>
          <Input
            value={value.station}
            onChange={(event) => onChange((current) => ({ ...current, station: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Select
            value={value.paymentMethod}
            onValueChange={(next) =>
              onChange((current) => ({
                ...current,
                paymentMethod: next as FuelFormState["paymentMethod"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["cash", "pix", "debit", "credit"] as const).map((method) => (
                <SelectItem key={method} value={method}>
                  {paymentMethodLabels[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Observações</Label>
          <Input
            value={value.notes}
            onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Prévia</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-400">Valor resolvido</p>
            <p className="font-heading text-xl text-zinc-50">
              {formatCurrencyBRL(preview?.totalCost ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Litros resolvidos</p>
            <p className="font-heading text-xl text-zinc-50">{preview?.liters ?? 0} L</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Preço por litro</p>
            <p className="font-heading text-xl text-zinc-50">
              {value.pricePerLiter
                ? formatCurrencyBRL(Number(value.pricePerLiter))
                : formatCurrencyBRL(0)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel ? (
          <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="button" className="flex-1 rounded-2xl" onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function FuelPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const saveFuelLog = useFinanceStore((state) => state.saveFuelLog);
  const deleteFuelLog = useFinanceStore((state) => state.deleteFuelLog);
  const [form, setForm] = React.useState(initialForm);
  const [editingForm, setEditingForm] = React.useState<FuelFormState | null>(null);
  const [filters, setFilters] = React.useState<FuelFilters>({
    month: selectedMonth,
    vehicleId: "",
    paymentMethod: "all",
    station: "all",
  });

  React.useEffect(() => {
    setFilters((current) => ({ ...current, month: selectedMonth }));
  }, [selectedMonth]);

  React.useEffect(() => {
    if (!snapshot?.vehicles.length) {
      return;
    }

    const fallbackVehicle = snapshot.vehicles.find((vehicle) => vehicle.id === filters.vehicleId) ?? snapshot.vehicles[0];

    setFilters((current) => ({
      ...current,
      vehicleId: current.vehicleId || fallbackVehicle.id,
    }));

    setForm((current) => ({
      ...current,
      vehicleId: current.vehicleId || fallbackVehicle.id,
      odometerKm: current.odometerKm || fallbackVehicle.currentOdometerKm,
    }));
  }, [filters.vehicleId, snapshot]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={4} rows={3} />;
  }

  if (!snapshot.vehicles.length) {
    return (
      <EmptyState
        icon={Fuel}
        title="Cadastre um veículo primeiro"
        description="Os abastecimentos precisam de um carro ou moto associado para calcular odômetro e custo real."
      />
    );
  }

  const vehicleOptions = snapshot.vehicles.map((vehicle) => ({
    id: vehicle.id,
    nickname: vehicle.nickname,
  }));
  const selectedVehicle =
    snapshot.vehicles.find((vehicle) => vehicle.id === filters.vehicleId) ?? snapshot.vehicles[0];
  const scopedLogs = snapshot.fuelLogs.filter((item) => item.vehicleId === selectedVehicle.id);
  const stationOptions = Array.from(
    new Set(scopedLogs.map((item) => item.station).filter((item): item is string => Boolean(item))),
  );
  const filteredLogs = scopedLogs
    .filter((item) => formatMonthKey(item.date) === filters.month)
    .filter((item) => (filters.paymentMethod === "all" ? true : item.paymentMethod === filters.paymentMethod))
    .filter((item) => (filters.station === "all" ? true : (item.station ?? "Sem posto") === filters.station))
    .sort((a, b) => b.date.localeCompare(a.date));

  const groupedLogs = Object.entries(groupByMonth(filteredLogs));
  const totalCost = filteredLogs.reduce((sum, item) => sum + item.totalCost, 0);
  const totalLiters = filteredLogs.reduce((sum, item) => sum + item.liters, 0);
  const averagePricePerLiter = totalLiters ? totalCost / totalLiters : 0;
  const lastOdometer = filteredLogs[0]?.odometerKm ?? selectedVehicle.currentOdometerKm;
  const fuelInsights = getMotoFuelInsights(snapshot, filters.month, selectedVehicle.id);

  function submitFuel(values: FuelFormState, afterSubmit?: () => void) {
    if (!values.vehicleId) {
      toast.error("Selecione o veículo.");
      return;
    }

    if (!values.pricePerLiter || Number(values.pricePerLiter) <= 0) {
      toast.error("Informe um preço por litro válido.");
      return;
    }

    if (
      (!values.totalCost || Number(values.totalCost) <= 0) &&
      (!values.liters || Number(values.liters) <= 0)
    ) {
      toast.error("Informe valor total ou litros para concluir o abastecimento.");
      return;
    }

    saveFuelLog({
      id: values.id,
      vehicleId: values.vehicleId,
      date: values.date,
      odometerKm: values.odometerKm,
      totalCost: values.totalCost ? Number(values.totalCost) : undefined,
      pricePerLiter: Number(values.pricePerLiter),
      liters: values.liters ? Number(values.liters) : undefined,
      station: values.station,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
    });

    toast.success(values.id ? "Abastecimento atualizado." : "Abastecimento salvo.");
    afterSubmit?.();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Abastecimentos</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Registre combustível com cálculo automático e histórico útil.
          </h1>
          <p className="text-sm text-zinc-400">{selectedVehicle.nickname}</p>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Receipt}
          label="Gasto filtrado"
          value={formatCurrencyBRL(totalCost)}
          detail={`${filteredLogs.length} abastecimento(s)`}
        />
        <SummaryCard
          icon={Droplets}
          label="Litros"
          value={`${totalLiters.toFixed(2)} L`}
          detail={`Distância: ${fuelInsights.monthlyDistanceKm} km`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={Fuel}
          label="Preço médio / L"
          value={formatCurrencyBRL(averagePricePerLiter)}
          detail={
            fuelInsights.actualKmPerLiter
              ? `Consumo real: ${fuelInsights.actualKmPerLiter} km/L`
              : "Consumo real aparece com mais histórico"
          }
          accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
        />
        <SummaryCard
          icon={GaugeCircle}
          label="Última quilometragem"
          value={`${lastOdometer} km`}
          detail={
            fuelInsights.averageCostPerKm
              ? `${formatCurrencyBRL(fuelInsights.averageCostPerKm)}/km`
              : "Odômetro mais recente"
          }
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo abastecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <FuelLogForm
            value={form}
            vehicles={vehicleOptions}
            onChange={setForm}
            onSubmit={() =>
              submitFuel(form, () =>
                setForm((current) => ({
                  ...initialForm,
                  vehicleId: current.vehicleId,
                  odometerKm: current.odometerKm,
                  date: new Date().toISOString().slice(0, 10),
                })),
              )
            }
            submitLabel="Salvar abastecimento"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico filtrável</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Veículo</Label>
              <Select
                value={filters.vehicleId}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    vehicleId: value,
                    station: "all",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Posto</Label>
              <Select
                value={filters.station}
                onValueChange={(value) => setFilters((current) => ({ ...current, station: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os postos</SelectItem>
                  {stationOptions.map((station) => (
                    <SelectItem key={station} value={station}>
                      {station}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    paymentMethod: value as FuelFilters["paymentMethod"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  {(["cash", "pix", "debit", "credit"] as const).map((method) => (
                    <SelectItem key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {groupedLogs.length ? (
            groupedLogs.map(([month, items]) => (
              <div key={month} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{month}</p>
                  <Badge variant="muted">{items.length} registro(s)</Badge>
                </div>
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="w-full rounded-2xl border border-white/8 bg-white/6 p-4 text-left transition hover:border-cyan-400/30 hover:bg-white/8"
                    onClick={() =>
                      setEditingForm(
                        toFuelFormState({
                          id: item.id,
                          vehicleId: item.vehicleId,
                          date: item.date,
                          odometerKm: item.odometerKm,
                          totalCost: item.totalCost,
                          pricePerLiter: item.pricePerLiter,
                          liters: item.liters,
                          station: item.station ?? "",
                          paymentMethod: item.paymentMethod,
                          notes: item.notes ?? "",
                        }),
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-zinc-50">{item.station ?? "Sem posto"}</p>
                          <Badge variant="muted">{paymentMethodLabels[item.paymentMethod]}</Badge>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {formatDateBR(item.date)} • {item.odometerKm} km • {item.liters} L
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                        <p className="text-sm text-zinc-400">{formatCurrencyBRL(item.pricePerLiter)}/L</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <EmptyState
              icon={Route}
              title="Nenhum abastecimento encontrado"
              description="Ajuste os filtros ou registre um novo abastecimento para montar o histórico."
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editingForm)} onOpenChange={(open) => (!open ? setEditingForm(null) : null)}>
        {editingForm ? (
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar abastecimento</SheetTitle>
              <SheetDescription>
                Atualize os dados ou exclua o registro sem perder a consistência do odômetro.
              </SheetDescription>
            </SheetHeader>
            <FuelLogForm
              value={editingForm}
              vehicles={vehicleOptions}
              onChange={(updater) =>
                setEditingForm((current) =>
                  typeof updater === "function" ? updater(current ?? initialForm) : updater,
                )
              }
              onSubmit={() => submitFuel(editingForm, () => setEditingForm(null))}
              submitLabel="Salvar alterações"
              onCancel={() => setEditingForm(null)}
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              onClick={() => {
                deleteFuelLog(editingForm.id!);
                toast.success("Abastecimento excluído.");
                setEditingForm(null);
              }}
            >
              Excluir abastecimento
            </Button>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
