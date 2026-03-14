"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";

const initialForm = {
  vehicleId: "",
  date: new Date().toISOString().slice(0, 10),
  odometerKm: 0,
  totalCost: "",
  pricePerLiter: "",
  liters: "",
  station: "",
  paymentMethod: "debit" as const,
  notes: "",
};

export function FuelPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const saveFuelLog = useFinanceStore((state) => state.saveFuelLog);
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
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Abastecimentos</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Registre o gasto da moto em segundos.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo abastecimento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Moto</Label>
            <Select value={form.vehicleId} onValueChange={(value) => setForm((current) => ({ ...current, vehicleId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moto" />
              </SelectTrigger>
              <SelectContent>
                {snapshot.vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.nickname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Odômetro (km)</Label>
            <Input type="number" value={form.odometerKm} onChange={(event) => setForm((current) => ({ ...current, odometerKm: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Preço por litro</Label>
            <Input type="number" step="0.01" value={form.pricePerLiter} onChange={(event) => setForm((current) => ({ ...current, pricePerLiter: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Valor total</Label>
            <Input type="number" step="0.01" value={form.totalCost} onChange={(event) => setForm((current) => ({ ...current, totalCost: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Litros</Label>
            <Input type="number" step="0.01" value={form.liters} onChange={(event) => setForm((current) => ({ ...current, liters: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Posto</Label>
            <Input value={form.station} onChange={(event) => setForm((current) => ({ ...current, station: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Pagamento</Label>
            <Select value={form.paymentMethod} onValueChange={(value) => setForm((current) => ({ ...current, paymentMethod: value as typeof form.paymentMethod }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button
              className="w-full rounded-2xl"
              onClick={() => {
                saveFuelLog({
                  vehicleId: form.vehicleId,
                  date: form.date,
                  odometerKm: form.odometerKm,
                  totalCost: form.totalCost ? Number(form.totalCost) : undefined,
                  pricePerLiter: Number(form.pricePerLiter),
                  liters: form.liters ? Number(form.liters) : undefined,
                  station: form.station,
                  paymentMethod: form.paymentMethod,
                  notes: form.notes,
                });
                toast.success("Abastecimento salvo.");
                setForm((current) => ({ ...initialForm, vehicleId: current.vehicleId, odometerKm: current.odometerKm, date: new Date().toISOString().slice(0, 10) }));
              }}
            >
              Salvar abastecimento
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.fuelLogs.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-50">{item.station ?? "Sem posto"}</p>
                  <p className="text-sm text-zinc-400">
                    {formatDateBR(item.date)} • {item.odometerKm} km • {item.liters} L
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
