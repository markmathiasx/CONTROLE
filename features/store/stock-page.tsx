"use client";

import * as React from "react";
import { AlertTriangle, Package, PaintBucket } from "lucide-react";
import { toast } from "sonner";

import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filamentMaterialOptions, supplyCategoryOptions, supplyUnitLabels } from "@/lib/constants";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import { getStoreStockSummary } from "@/utils/finance";

const initialFilamentForm = {
  purchaseDate: new Date().toISOString().slice(0, 10),
  totalCost: 200,
  totalWeightGrams: 4000,
  spoolCount: 4,
  material: "PLA",
  color: "Branco",
  brand: "Voolt3D",
  supplier: "",
  notes: "",
};

const initialSupplyForm = {
  name: "",
  category: "Primer branco",
  unit: "ml" as const,
  totalQuantity: 500,
  totalCost: 20,
  purchaseDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function StockPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const saveFilamentPurchase = useFinanceStore((state) => state.saveFilamentPurchase);
  const saveSupplyItem = useFinanceStore((state) => state.saveSupplyItem);
  const [filamentForm, setFilamentForm] = React.useState(initialFilamentForm);
  const [supplyForm, setSupplyForm] = React.useState(initialSupplyForm);

  if (!initialized || !snapshot) {
    return null;
  }

  const stock = getStoreStockSummary(snapshot);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Estoque da loja</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Filamentos e insumos com custo real e saldo restante.
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Package}
          label="Rolos em estoque"
          value={`${stock.filamentCount}`}
          detail={`${stock.criticalSpools.length} crítico(s)`}
        />
        <SummaryCard
          icon={PaintBucket}
          label="Insumos ativos"
          value={`${stock.supplyCount}`}
          detail={`${stock.criticalSupplies.length} crítico(s)`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Atenção"
          value={`${stock.criticalStockCount}`}
          detail="Itens abaixo de 20%"
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
          badge={{
            text: stock.criticalStockCount ? "Revisar" : "OK",
            tone: stock.criticalStockCount ? "warning" : "default",
          }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compra agrupada de filamentos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={filamentForm.purchaseDate} onChange={(event) => setFilamentForm((current) => ({ ...current, purchaseDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Custo total</Label>
              <Input type="number" step="0.01" value={filamentForm.totalCost} onChange={(event) => setFilamentForm((current) => ({ ...current, totalCost: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Peso total (g)</Label>
              <Input type="number" value={filamentForm.totalWeightGrams} onChange={(event) => setFilamentForm((current) => ({ ...current, totalWeightGrams: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Qtde de rolos</Label>
              <Input type="number" value={filamentForm.spoolCount} onChange={(event) => setFilamentForm((current) => ({ ...current, spoolCount: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Select value={filamentForm.material} onValueChange={(value) => setFilamentForm((current) => ({ ...current, material: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filamentMaterialOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input value={filamentForm.color} onChange={(event) => setFilamentForm((current) => ({ ...current, color: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input value={filamentForm.brand} onChange={(event) => setFilamentForm((current) => ({ ...current, brand: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input value={filamentForm.supplier} onChange={(event) => setFilamentForm((current) => ({ ...current, supplier: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Input value={filamentForm.notes} onChange={(event) => setFilamentForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button
                className="w-full rounded-2xl"
                onClick={() => {
                  saveFilamentPurchase(filamentForm);
                  toast.success("Compra agrupada registrada.");
                  setFilamentForm(initialFilamentForm);
                }}
              >
                Registrar compra de filamentos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novo insumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={supplyForm.name} onChange={(event) => setSupplyForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={supplyForm.category} onValueChange={(value) => setSupplyForm((current) => ({ ...current, category: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {supplyCategoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={supplyForm.unit} onValueChange={(value) => setSupplyForm((current) => ({ ...current, unit: value as typeof current.unit }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(supplyUnitLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade total</Label>
              <Input type="number" step="0.01" value={supplyForm.totalQuantity} onChange={(event) => setSupplyForm((current) => ({ ...current, totalQuantity: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Custo total</Label>
              <Input type="number" step="0.01" value={supplyForm.totalCost} onChange={(event) => setSupplyForm((current) => ({ ...current, totalCost: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Data da compra</Label>
              <Input type="date" value={supplyForm.purchaseDate} onChange={(event) => setSupplyForm((current) => ({ ...current, purchaseDate: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Input value={supplyForm.notes} onChange={(event) => setSupplyForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button
                className="w-full rounded-2xl"
                onClick={() => {
                  saveSupplyItem(supplyForm);
                  toast.success("Insumo salvo.");
                  setSupplyForm(initialSupplyForm);
                }}
              >
                Registrar insumo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Filamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.filamentSpools.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-50">{item.name}</p>
                    <p className="text-sm text-zinc-400">
                      {item.remainingWeightGrams} g restantes de {item.nominalWeightGrams} g
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.purchaseCost)}</p>
                    <p className="text-sm text-zinc-400">{formatDateBR(item.purchaseDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insumos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.supplyItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-50">{item.name}</p>
                    <p className="text-sm text-zinc-400">
                      {item.remainingQuantity} / {item.totalQuantity} {supplyUnitLabels[item.unit]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                    <p className="text-sm text-zinc-400">{formatDateBR(item.purchaseDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
