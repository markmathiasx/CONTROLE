"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";

type MaterialDraft = {
  id: string;
  itemKind: "filament" | "supply";
  itemId: string;
  quantity: number;
  wasteQuantity: number;
};

type ProductionFormState = {
  name: string;
  client: string;
  date: string;
  quantityProduced: number;
  quantitySold: number;
  status: "budget" | "in-production" | "ready" | "delivered" | "cancelled";
  printHours: number;
  finishingHours: number;
  additionalManualCost: number;
  packagingCost: number;
  salePriceUnit: number;
  salePriceTotal: number;
  notes: string;
  materials: MaterialDraft[];
};

const initialMaterial: MaterialDraft = {
  id: "line_1",
  itemKind: "filament",
  itemId: "",
  quantity: 0,
  wasteQuantity: 0,
};

const initialForm: ProductionFormState = {
  name: "",
  client: "",
  date: new Date().toISOString().slice(0, 10),
  quantityProduced: 1,
  quantitySold: 0,
  status: "budget",
  printHours: 1,
  finishingHours: 0,
  additionalManualCost: 0,
  packagingCost: 0,
  salePriceUnit: 0,
  salePriceTotal: 0,
  notes: "",
  materials: [initialMaterial],
};

export function ProductionPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const saveProductionJob = useFinanceStore((state) => state.saveProductionJob);
  const [form, setForm] = React.useState(initialForm);

  if (!initialized || !snapshot) {
    return null;
  }

  const materialOptions = {
    filament: snapshot.filamentSpools.map((item) => ({ id: item.id, label: `${item.name} (${item.remainingWeightGrams} g)` })),
    supply: snapshot.supplyItems.map((item) => ({ id: item.id, label: `${item.name} (${item.remainingQuantity})` })),
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Produção</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Calcule custo real da peça antes de vender.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova produção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Nome da peça</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={form.client} onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as typeof current.status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Orçamento</SelectItem>
                  <SelectItem value="in-production">Em produção</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Qtde produzida</Label>
              <Input type="number" value={form.quantityProduced} onChange={(event) => setForm((current) => ({ ...current, quantityProduced: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Qtde vendida</Label>
              <Input type="number" value={form.quantitySold} onChange={(event) => setForm((current) => ({ ...current, quantitySold: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Horas de impressão</Label>
              <Input type="number" step="0.1" value={form.printHours} onChange={(event) => setForm((current) => ({ ...current, printHours: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Horas de acabamento</Label>
              <Input type="number" step="0.1" value={form.finishingHours} onChange={(event) => setForm((current) => ({ ...current, finishingHours: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Custo manual extra</Label>
              <Input type="number" step="0.01" value={form.additionalManualCost} onChange={(event) => setForm((current) => ({ ...current, additionalManualCost: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Embalagem</Label>
              <Input type="number" step="0.01" value={form.packagingCost} onChange={(event) => setForm((current) => ({ ...current, packagingCost: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Preço unitário</Label>
              <Input type="number" step="0.01" value={form.salePriceUnit} onChange={(event) => setForm((current) => ({ ...current, salePriceUnit: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Preço total</Label>
              <Input type="number" step="0.01" value={form.salePriceTotal} onChange={(event) => setForm((current) => ({ ...current, salePriceTotal: Number(event.target.value) }))} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Materiais usados</Label>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    materials: [
                      ...current.materials,
                      { id: crypto.randomUUID(), itemKind: "filament", itemId: "", quantity: 0, wasteQuantity: 0 },
                    ],
                  }))
                }
              >
                <Plus className="size-4" />
                Adicionar material
              </Button>
            </div>

            {form.materials.map((material) => (
              <div key={material.id} className="grid gap-3 rounded-2xl border border-white/8 bg-white/6 p-4 md:grid-cols-4 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={material.itemKind}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        materials: current.materials.map((item) =>
                          item.id === material.id ? { ...item, itemKind: value as "filament" | "supply", itemId: "" } : item,
                        ),
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filament">Filamento</SelectItem>
                      <SelectItem value="supply">Insumo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select
                    value={material.itemId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        materials: current.materials.map((item) => (item.id === material.id ? { ...item, itemId: value } : item)),
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {materialOptions[material.itemKind].map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" step="0.01" value={material.quantity} onChange={(event) => setForm((current) => ({ ...current, materials: current.materials.map((item) => (item.id === material.id ? { ...item, quantity: Number(event.target.value) } : item)) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Desperdício</Label>
                  <Input type="number" step="0.01" value={material.wasteQuantity} onChange={(event) => setForm((current) => ({ ...current, materials: current.materials.map((item) => (item.id === material.id ? { ...item, wasteQuantity: Number(event.target.value) } : item)) }))} />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-2xl"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        materials: current.materials.length === 1 ? current.materials : current.materials.filter((item) => item.id !== material.id),
                      }))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>

          <Button
            className="w-full rounded-2xl"
            onClick={() => {
              try {
                saveProductionJob({
                  ...form,
                  materials: form.materials.map((material) => ({
                    itemKind: material.itemKind,
                    itemId: material.itemId,
                    quantity: material.quantity,
                    wasteQuantity: material.wasteQuantity,
                  })),
                });
                toast.success("Produção salva.");
                setForm(initialForm);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Falha ao salvar produção.");
              }
            }}
          >
            Salvar produção
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produções recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.productionJobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-50">{job.name}</p>
                  <p className="text-sm text-zinc-400">
                    {formatDateBR(job.date)} • {job.quantityProduced} un • {job.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-50">{formatCurrencyBRL(job.totalCost)}</p>
                  <p className="text-sm text-zinc-400">Lucro {formatCurrencyBRL(job.grossProfit)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
