"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Route, ShieldAlert, Wrench } from "lucide-react";
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
import {
  findVehiclePreset,
  getVehicleMaintenanceReferences,
  maintenanceCategoryLabels,
  paymentMethodLabels,
} from "@/lib/constants";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { formatMonthKey } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import type { MaintenanceFilters, MaintenanceLogFormValues } from "@/types/forms";
import { getMaintenanceReminders } from "@/utils/finance";

type MaintenanceFormState = {
  id?: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  type: string;
  category: MaintenanceLogFormValues["category"];
  description: string;
  totalCost: string;
  shop: string;
  recurringMonths: string;
  recurringKm: string;
  notes: string;
  paymentMethod: MaintenanceLogFormValues["paymentMethod"];
};

const initialForm: MaintenanceFormState = {
  vehicleId: "",
  date: new Date().toISOString().slice(0, 10),
  odometerKm: 0,
  type: "",
  category: "troca-de-oleo",
  description: "",
  totalCost: "",
  shop: "",
  recurringMonths: "",
  recurringKm: "",
  notes: "",
  paymentMethod: "pix",
};

function toMaintenanceFormState(
  values?: Partial<MaintenanceLogFormValues> & { id?: string },
): MaintenanceFormState {
  return {
    id: values?.id,
    vehicleId: values?.vehicleId ?? "",
    date: values?.date ?? new Date().toISOString().slice(0, 10),
    odometerKm: values?.odometerKm ?? 0,
    type: values?.type ?? "",
    category: values?.category ?? "troca-de-oleo",
    description: values?.description ?? "",
    totalCost: values?.totalCost ? String(values.totalCost) : "",
    shop: values?.shop ?? "",
    recurringMonths: values?.recurringMonths ? String(values.recurringMonths) : "",
    recurringKm: values?.recurringKm ? String(values.recurringKm) : "",
    notes: values?.notes ?? "",
    paymentMethod: values?.paymentMethod ?? "pix",
  };
}

function groupByMonth<T extends { date: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const month = formatMonthKey(item.date);
    acc[month] = [...(acc[month] ?? []), item];
    return acc;
  }, {});
}

function MaintenanceForm({
  value,
  vehicles,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  value: MaintenanceFormState;
  vehicles: Array<{ id: string; nickname: string }>;
  onChange: React.Dispatch<React.SetStateAction<MaintenanceFormState>>;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
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
          <Label>Km atual</Label>
          <Input
            type="number"
            value={value.odometerKm}
            onChange={(event) =>
              onChange((current) => ({ ...current, odometerKm: Number(event.target.value) }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Select
            value={value.paymentMethod}
            onValueChange={(next) =>
              onChange((current) => ({
                ...current,
                paymentMethod: next as MaintenanceFormState["paymentMethod"],
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
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Input
            value={value.type}
            onChange={(event) => onChange((current) => ({ ...current, type: event.target.value }))}
            placeholder="Ex.: troca preventiva"
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={value.category}
            onValueChange={(next) =>
              onChange((current) => ({
                ...current,
                category: next as MaintenanceFormState["category"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(maintenanceCategoryLabels).map(([slug, label]) => (
                <SelectItem key={slug} value={slug}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Descrição</Label>
          <Input
            value={value.description}
            onChange={(event) =>
              onChange((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
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
          <Label>Oficina</Label>
          <Input
            value={value.shop}
            onChange={(event) => onChange((current) => ({ ...current, shop: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Repetir em meses</Label>
          <Input
            type="number"
            value={value.recurringMonths}
            onChange={(event) =>
              onChange((current) => ({ ...current, recurringMonths: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Repetir em km</Label>
          <Input
            type="number"
            value={value.recurringKm}
            onChange={(event) =>
              onChange((current) => ({ ...current, recurringKm: event.target.value }))
            }
          />
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
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Próximo cuidado</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-400">Por tempo</p>
            <p className="font-heading text-xl text-zinc-50">
              {value.recurringMonths ? `${value.recurringMonths} mês(es)` : "Sem recorrência"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Por quilometragem</p>
            <p className="font-heading text-xl text-zinc-50">
              {value.recurringKm ? `${value.recurringKm} km` : "Sem recorrência"}
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

export function MaintenancePage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const saveMaintenanceLog = useFinanceStore((state) => state.saveMaintenanceLog);
  const deleteMaintenanceLog = useFinanceStore((state) => state.deleteMaintenanceLog);
  const [form, setForm] = React.useState(initialForm);
  const [editingForm, setEditingForm] = React.useState<MaintenanceFormState | null>(null);
  const [filters, setFilters] = React.useState<MaintenanceFilters>({
    month: selectedMonth,
    vehicleId: "",
    category: "all",
    reminderStatus: "all",
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
      <div className="space-y-4">
        <EmptyState
          icon={Wrench}
          title="Cadastre um veículo primeiro"
          description="As manutenções precisam de um carro ou moto associado para gerar lembretes e custo real."
        />
        <Button asChild className="w-full rounded-2xl">
          <Link href="/configuracoes" prefetch={false}>
            Abrir catálogo de veículos
          </Link>
        </Button>
      </div>
    );
  }

  const reminders = getMaintenanceReminders(snapshot, filters.vehicleId || undefined);
  const reminderByLogId = new Map(reminders.map((reminder) => [reminder.maintenanceLogId, reminder]));
  const vehicleOptions = snapshot.vehicles.map((vehicle) => ({
    id: vehicle.id,
    nickname: vehicle.nickname,
  }));
  const selectedVehicle =
    snapshot.vehicles.find((vehicle) => vehicle.id === filters.vehicleId) ?? snapshot.vehicles[0];
  const selectedVehiclePreset = findVehiclePreset(
    selectedVehicle.brand,
    selectedVehicle.model,
    selectedVehicle.year,
  );
  const maintenanceTemplates = getVehicleMaintenanceReferences({
    presetId: selectedVehiclePreset?.id,
    vehicleType: selectedVehicle.vehicleType ?? "motorcycle",
  });
  const maintenanceTemplateSourceLabel = selectedVehiclePreset
    ? selectedVehiclePreset.label
    : (selectedVehicle.vehicleType ?? "motorcycle") === "car"
      ? "Carro (genérico)"
      : "Moto (genérico)";
  const scopedLogs = snapshot.maintenanceLogs.filter((item) => item.vehicleId === selectedVehicle.id);
  const filteredLogs = scopedLogs
    .filter((item) => formatMonthKey(item.date) === filters.month)
    .filter((item) => (filters.category === "all" ? true : item.category === filters.category))
    .filter((item) => {
      if (filters.reminderStatus === "all") {
        return true;
      }

      const reminder = reminderByLogId.get(item.id);
      if (filters.reminderStatus === "overdue") {
        return Boolean(reminder?.isOverdue);
      }
      if (filters.reminderStatus === "upcoming") {
        return Boolean(reminder && !reminder.isOverdue);
      }

      return !reminder;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const groupedLogs = Object.entries(groupByMonth(filteredLogs));
  const totalCost = filteredLogs.reduce((sum, item) => sum + item.totalCost, 0);
  const overdueCount = filteredLogs.filter((item) => reminderByLogId.get(item.id)?.isOverdue).length;
  const recurringCount = filteredLogs.filter((item) => item.recurringKm || item.recurringMonths).length;
  const topCategory = Object.entries(
    filteredLogs.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.totalCost;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];

  function submitMaintenance(values: MaintenanceFormState, afterSubmit?: () => void) {
    if (!values.vehicleId) {
      toast.error("Selecione o veículo.");
      return;
    }
    if (!values.description.trim()) {
      toast.error("Descreva a manutenção.");
      return;
    }
    if (!values.type.trim()) {
      toast.error("Informe o tipo da manutenção.");
      return;
    }
    if (!values.totalCost || Number(values.totalCost) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    saveMaintenanceLog({
      id: values.id,
      vehicleId: values.vehicleId,
      date: values.date,
      odometerKm: values.odometerKm,
      type: values.type,
      category: values.category,
      description: values.description,
      totalCost: Number(values.totalCost),
      shop: values.shop,
      recurringMonths: values.recurringMonths ? Number(values.recurringMonths) : undefined,
      recurringKm: values.recurringKm ? Number(values.recurringKm) : undefined,
      notes: values.notes,
      paymentMethod: values.paymentMethod,
    });

    toast.success(values.id ? "Manutenção atualizada." : "Manutenção salva.");
    afterSubmit?.();
  }

  function applyMaintenanceTemplate(templateId: string) {
    const template = maintenanceTemplates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    const estimatedMidCost = (template.estimatedCostMin + template.estimatedCostMax) / 2;
    setForm((current) => ({
      ...current,
      type: template.label,
      category: template.category,
      description: `${template.label} • ${selectedVehicle.nickname}`,
      totalCost: String(Math.round(estimatedMidCost)),
      recurringMonths: template.recommendedMonthsInterval
        ? String(template.recommendedMonthsInterval)
        : "",
      recurringKm: template.recommendedKmInterval ? String(template.recommendedKmInterval) : "",
      notes: `Peças: ${template.typicalParts.join(", ")}`,
      vehicleId: selectedVehicle.id,
      odometerKm: current.odometerKm || selectedVehicle.currentOdometerKm,
    }));
    toast.success("Template aplicado no formulário.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Manutenções</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Timeline de serviços com lembretes por data e quilometragem.
          </h1>
          <p className="text-sm text-zinc-400">{selectedVehicle.nickname}</p>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wrench}
          label="Custo filtrado"
          value={formatCurrencyBRL(totalCost)}
          detail={`${filteredLogs.length} manutenção(ões)`}
        />
        <SummaryCard
          icon={ShieldAlert}
          label="Atrasadas"
          value={`${overdueCount}`}
          detail="Precisam de atenção"
          accent="from-rose-400/20 via-rose-500/10 to-transparent"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Com recorrência"
          value={`${recurringCount}`}
          detail="Por mês ou km"
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
        <SummaryCard
          icon={Route}
          label="Categoria mais cara"
          value={
            topCategory
              ? maintenanceCategoryLabels[topCategory[0] as keyof typeof maintenanceCategoryLabels]
              : "Sem dados"
          }
          detail={topCategory ? formatCurrencyBRL(topCategory[1]) : "No período filtrado"}
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova manutenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-100">
                Checklist rápido de peças e serviços
              </p>
              <Badge variant="muted">{maintenanceTemplateSourceLabel}</Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Toque em um template para preencher tipo, categoria, faixa de custo e recorrência.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {maintenanceTemplates.slice(0, 8).map((template) => (
                <button
                  type="button"
                  key={template.id}
                  onClick={() => applyMaintenanceTemplate(template.id)}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-violet-300/40 hover:bg-black/30"
                >
                  <p className="text-sm font-medium text-zinc-100">{template.label}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {template.recommendedKmInterval ? `${template.recommendedKmInterval} km` : "km livre"}
                    {template.recommendedMonthsInterval ? ` • ${template.recommendedMonthsInterval} meses` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatCurrencyBRL(template.estimatedCostMin)} a {formatCurrencyBRL(template.estimatedCostMax)}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <MaintenanceForm
            value={form}
            vehicles={vehicleOptions}
            onChange={setForm}
            onSubmit={() =>
              submitMaintenance(form, () =>
                setForm((current) => ({
                  ...initialForm,
                  vehicleId: current.vehicleId,
                  odometerKm: current.odometerKm,
                  date: new Date().toISOString().slice(0, 10),
                })),
              )
            }
            submitLabel="Salvar manutenção"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline filtrável</CardTitle>
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
                    reminderStatus: "all",
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
              <Label>Categoria</Label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    category: value as MaintenanceFilters["category"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(maintenanceCategoryLabels).map(([slug, label]) => (
                    <SelectItem key={slug} value={slug}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status do lembrete</Label>
              <Select
                value={filters.reminderStatus}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    reminderStatus: value as MaintenanceFilters["reminderStatus"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="overdue">Atrasados</SelectItem>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="none">Sem recorrência</SelectItem>
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
                {items.map((item) => {
                  const reminder = reminderByLogId.get(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className="w-full rounded-2xl border border-white/8 bg-white/6 p-4 text-left transition hover:border-violet-400/30 hover:bg-white/8"
                      onClick={() =>
                        setEditingForm(
                          toMaintenanceFormState({
                            id: item.id,
                            vehicleId: item.vehicleId,
                            date: item.date,
                            odometerKm: item.odometerKm,
                            type: item.type,
                            category: item.category,
                            description: item.description,
                            totalCost: item.totalCost,
                            shop: item.shop ?? "",
                            recurringMonths: item.recurringMonths ?? undefined,
                            recurringKm: item.recurringKm ?? undefined,
                            notes: item.notes ?? "",
                            paymentMethod: item.paymentMethod ?? "pix",
                          }),
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-zinc-50">{item.description}</p>
                            <Badge variant="muted">{maintenanceCategoryLabels[item.category]}</Badge>
                            {reminder ? (
                              <Badge variant={reminder.isOverdue ? "danger" : "warning"}>
                                {reminder.isOverdue ? "Atrasado" : "Próximo"}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-zinc-400">
                            {formatDateBR(item.date)} • {item.odometerKm} km • {item.type}
                          </p>
                          {reminder ? (
                            <p className="text-xs text-zinc-500">
                              {reminder.dueDate ? `Prazo: ${formatDateBR(reminder.dueDate)}` : "Sem data"}
                              {reminder.dueKm ? ` • ${reminder.dueKm} km` : ""}
                            </p>
                          ) : null}
                        </div>
                        <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <EmptyState
              icon={Wrench}
              title="Nenhuma manutenção encontrada"
              description="Ajuste os filtros ou registre um serviço para começar a timeline do veículo."
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editingForm)} onOpenChange={(open) => (!open ? setEditingForm(null) : null)}>
        {editingForm ? (
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar manutenção</SheetTitle>
              <SheetDescription>
                Atualize a timeline e os próximos cuidados sem perder o vínculo financeiro do veículo.
              </SheetDescription>
            </SheetHeader>
            <MaintenanceForm
              value={editingForm}
              vehicles={vehicleOptions}
              onChange={(updater) =>
                setEditingForm((current) =>
                  typeof updater === "function" ? updater(current ?? initialForm) : updater,
                )
              }
              onSubmit={() => submitMaintenance(editingForm, () => setEditingForm(null))}
              submitLabel="Salvar alterações"
              onCancel={() => setEditingForm(null)}
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              onClick={() => {
                deleteMaintenanceLog(editingForm.id!);
                toast.success("Manutenção excluída.");
                setEditingForm(null);
              }}
            >
              Excluir manutenção
            </Button>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
