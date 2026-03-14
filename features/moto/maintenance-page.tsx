"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maintenanceCategoryLabels } from "@/lib/constants";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";

const initialForm = {
  vehicleId: "",
  date: new Date().toISOString().slice(0, 10),
  odometerKm: 0,
  type: "",
  category: "troca-de-oleo" as const,
  description: "",
  totalCost: "",
  shop: "",
  recurringMonths: "",
  recurringKm: "",
  notes: "",
  paymentMethod: "pix" as const,
};

export function MaintenancePage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const saveMaintenanceLog = useFinanceStore((state) => state.saveMaintenanceLog);
  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => {
    if (snapshot?.vehicles[0]) {
      setForm((current) => ({
        ...current,
        vehicleId: snapshot.vehicles[0].id,
        odometerKm: snapshot.vehicles[0].currentOdometerKm,
      }));
    }
  }, [snapshot]);

  if (!initialized || !snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Manutenções</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Guarde o histórico e os próximos cuidados da moto.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova manutenção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Km atual</Label>
            <Input type="number" value={form.odometerKm} onChange={(event) => setForm((current) => ({ ...current, odometerKm: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Input value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} placeholder="Ex.: troca preventiva" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value as typeof current.category }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(maintenanceCategoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input type="number" step="0.01" value={form.totalCost} onChange={(event) => setForm((current) => ({ ...current, totalCost: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Oficina</Label>
            <Input value={form.shop} onChange={(event) => setForm((current) => ({ ...current, shop: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Repetir em meses</Label>
            <Input type="number" value={form.recurringMonths} onChange={(event) => setForm((current) => ({ ...current, recurringMonths: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Repetir em km</Label>
            <Input type="number" value={form.recurringKm} onChange={(event) => setForm((current) => ({ ...current, recurringKm: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button
              className="w-full rounded-2xl"
              onClick={() => {
                saveMaintenanceLog({
                  vehicleId: form.vehicleId,
                  date: form.date,
                  odometerKm: form.odometerKm,
                  type: form.type,
                  category: form.category,
                  description: form.description,
                  totalCost: Number(form.totalCost),
                  shop: form.shop,
                  recurringMonths: form.recurringMonths ? Number(form.recurringMonths) : undefined,
                  recurringKm: form.recurringKm ? Number(form.recurringKm) : undefined,
                  notes: form.notes,
                  paymentMethod: form.paymentMethod,
                });
                toast.success("Manutenção salva.");
                setForm((current) => ({ ...initialForm, vehicleId: current.vehicleId, odometerKm: current.odometerKm, date: new Date().toISOString().slice(0, 10) }));
              }}
            >
              Salvar manutenção
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.maintenanceLogs.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-50">{item.description}</p>
                  <p className="text-sm text-zinc-400">
                    {formatDateBR(item.date)} • {item.odometerKm} km • {maintenanceCategoryLabels[item.category]}
                  </p>
                </div>
                <p className="font-semibold text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
