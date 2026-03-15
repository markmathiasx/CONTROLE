"use client";

import * as React from "react";
import { AlertTriangle, Boxes, Package, PaintBucket, Replace } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { filamentMaterialOptions, supplyCategoryOptions, supplyUnitLabels } from "@/lib/constants";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { formatMonthKey } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import type { StockAdjustmentFormValues, StockMovementFilters, SupplyItemFormValues } from "@/types/forms";
import { getStoreMovementFeed, getStoreStockSummary } from "@/utils/finance";
import { splitGroupedFilamentPurchase } from "@/utils/operations";

const movementKindLabels = {
  purchase: "Entrada",
  consume: "Consumo",
  waste: "Desperdício",
  adjustment: "Ajuste",
} as const;

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

const initialSupplyForm: SupplyItemFormValues = {
  name: "",
  category: "Primer branco",
  unit: "ml",
  totalQuantity: 500,
  totalCost: 20,
  purchaseDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

type AdjustmentSheetState = {
  itemKind: StockAdjustmentFormValues["itemKind"];
  itemId: string;
  itemName: string;
  currentRemaining: number;
  quantityDelta: string;
  occurredAt: string;
  notes: string;
};

export function StockPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const saveFilamentPurchase = useFinanceStore((state) => state.saveFilamentPurchase);
  const saveSupplyItem = useFinanceStore((state) => state.saveSupplyItem);
  const saveStockAdjustment = useFinanceStore((state) => state.saveStockAdjustment);
  const [filamentForm, setFilamentForm] = React.useState(initialFilamentForm);
  const [supplyForm, setSupplyForm] = React.useState(initialSupplyForm);
  const [adjustmentSheet, setAdjustmentSheet] = React.useState<AdjustmentSheetState | null>(null);
  const [movementFilters, setMovementFilters] = React.useState<StockMovementFilters>({
    month: selectedMonth,
    itemKind: "all",
    movementKind: "all",
  });

  React.useEffect(() => {
    setMovementFilters((current) => ({ ...current, month: selectedMonth }));
  }, [selectedMonth]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={4} rows={4} />;
  }

  const stock = getStoreStockSummary(snapshot);
  const purchasePreview = splitGroupedFilamentPurchase({
    totalCost: filamentForm.totalCost,
    totalWeightGrams: filamentForm.totalWeightGrams,
    spoolCount: filamentForm.spoolCount,
  });
  const movementMonths = Array.from(
    new Set(snapshot.stockMovements.map((movement) => formatMonthKey(movement.occurredAt))),
  ).sort((a, b) => b.localeCompare(a));
  const movementFeed = getStoreMovementFeed(snapshot, movementFilters);

  function openAdjustmentSheet(params: {
    itemKind: StockAdjustmentFormValues["itemKind"];
    itemId: string;
    itemName: string;
    currentRemaining: number;
  }) {
    setAdjustmentSheet({
      ...params,
      quantityDelta: "",
      occurredAt: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }

  function applyAdjustment() {
    if (!adjustmentSheet) {
      return;
    }
    if (!adjustmentSheet.quantityDelta || Number(adjustmentSheet.quantityDelta) === 0) {
      toast.error("Informe um ajuste diferente de zero.");
      return;
    }

    try {
      saveStockAdjustment({
        itemKind: adjustmentSheet.itemKind,
        itemId: adjustmentSheet.itemId,
        quantityDelta: Number(adjustmentSheet.quantityDelta),
        occurredAt: adjustmentSheet.occurredAt,
        notes: adjustmentSheet.notes,
      });
      toast.success("Ajuste aplicado.");
      setAdjustmentSheet(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao ajustar estoque.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Estoque da loja</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Filamentos, insumos e movimentações com custo real por unidade.
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Package} label="Rolos em estoque" value={`${stock.filamentCount}`} detail={`${formatCurrencyBRL(stock.filamentValue)} em valor restante`} />
        <SummaryCard icon={PaintBucket} label="Insumos ativos" value={`${stock.supplyCount}`} detail={`${formatCurrencyBRL(stock.supplyValue)} em valor restante`} accent="from-cyan-400/20 via-cyan-500/10 to-transparent" />
        <SummaryCard icon={AlertTriangle} label="Estoque crítico" value={`${stock.criticalStockCount}`} detail="Abaixo de 20% do saldo nominal" accent="from-amber-400/20 via-amber-500/10 to-transparent" />
        <SummaryCard icon={Boxes} label="Movimentações" value={`${movementFeed.length}`} detail="Após os filtros aplicados" accent="from-violet-400/20 via-violet-500/10 to-transparent" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compra agrupada de filamentos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={filamentForm.purchaseDate} onChange={(event) => setFilamentForm((current) => ({ ...current, purchaseDate: event.target.value }))} /></div>
              <div className="space-y-2"><Label>Custo total</Label><Input type="number" step="0.01" value={filamentForm.totalCost} onChange={(event) => setFilamentForm((current) => ({ ...current, totalCost: Number(event.target.value) }))} /></div>
              <div className="space-y-2"><Label>Peso total (g)</Label><Input type="number" value={filamentForm.totalWeightGrams} onChange={(event) => setFilamentForm((current) => ({ ...current, totalWeightGrams: Number(event.target.value) }))} /></div>
              <div className="space-y-2"><Label>Qtde de rolos</Label><Input type="number" value={filamentForm.spoolCount} onChange={(event) => setFilamentForm((current) => ({ ...current, spoolCount: Number(event.target.value) }))} /></div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={filamentForm.material} onValueChange={(value) => setFilamentForm((current) => ({ ...current, material: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{filamentMaterialOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Cor</Label><Input value={filamentForm.color} onChange={(event) => setFilamentForm((current) => ({ ...current, color: event.target.value }))} /></div>
              <div className="space-y-2"><Label>Marca</Label><Input value={filamentForm.brand} onChange={(event) => setFilamentForm((current) => ({ ...current, brand: event.target.value }))} /></div>
              <div className="space-y-2"><Label>Fornecedor</Label><Input value={filamentForm.supplier} onChange={(event) => setFilamentForm((current) => ({ ...current, supplier: event.target.value }))} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Peso por rolo</p><p className="mt-2 font-heading text-xl text-zinc-50">{purchasePreview.nominalWeightGrams} g</p></div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Custo por rolo</p><p className="mt-2 font-heading text-xl text-zinc-50">{formatCurrencyBRL(purchasePreview.purchaseCost)}</p></div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Custo por grama</p><p className="mt-2 font-heading text-xl text-zinc-50">{formatCurrencyBRL(purchasePreview.costPerGram)}</p></div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Rolos gerados</p><p className="mt-2 font-heading text-xl text-zinc-50">{filamentForm.spoolCount}</p></div>
            </div>
            <Button className="w-full rounded-2xl" onClick={() => { saveFilamentPurchase(filamentForm); toast.success("Compra agrupada registrada."); setFilamentForm(initialFilamentForm); }}>
              Registrar compra de filamentos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Novo insumo</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={supplyForm.name} onChange={(event) => setSupplyForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={supplyForm.category} onValueChange={(value) => setSupplyForm((current) => ({ ...current, category: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{supplyCategoryOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={supplyForm.unit} onValueChange={(value) => setSupplyForm((current) => ({ ...current, unit: value as SupplyItemFormValues["unit"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(supplyUnitLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantidade total</Label><Input type="number" step="0.01" value={supplyForm.totalQuantity} onChange={(event) => setSupplyForm((current) => ({ ...current, totalQuantity: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Custo total</Label><Input type="number" step="0.01" value={supplyForm.totalCost} onChange={(event) => setSupplyForm((current) => ({ ...current, totalCost: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Data da compra</Label><Input type="date" value={supplyForm.purchaseDate} onChange={(event) => setSupplyForm((current) => ({ ...current, purchaseDate: event.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Observações</Label><Input value={supplyForm.notes ?? ""} onChange={(event) => setSupplyForm((current) => ({ ...current, notes: event.target.value }))} /></div>
            <div className="md:col-span-2">
              <Button className="w-full rounded-2xl" onClick={() => { saveSupplyItem(supplyForm); toast.success("Insumo salvo."); setSupplyForm(initialSupplyForm); }}>
                Registrar insumo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Filamentos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {snapshot.filamentSpools.length ? snapshot.filamentSpools.map((item) => {
              const isCritical = item.remainingWeightGrams <= item.nominalWeightGrams * 0.2;
              return (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-50">{item.name}</p>
                        <Badge variant={isCritical ? "warning" : "default"}>{isCritical ? "Crítico" : "OK"}</Badge>
                      </div>
                      <p className="text-sm text-zinc-400">{item.material} • {item.color} • {item.brand}</p>
                      <p className="text-sm text-zinc-400">{item.remainingWeightGrams} g de {item.nominalWeightGrams} g</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.purchaseCost)}</p>
                      <p className="text-sm text-zinc-400">{formatCurrencyBRL(item.costPerGram)}/g</p>
                      <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => openAdjustmentSheet({ itemKind: "filament", itemId: item.id, itemName: item.name, currentRemaining: item.remainingWeightGrams })}>
                        <Replace className="size-4" />
                        Ajustar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }) : <EmptyState icon={Package} title="Nenhum filamento em estoque" description="Use a compra agrupada para distribuir custo por rolo e começar a controlar consumo real." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Insumos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {snapshot.supplyItems.length ? snapshot.supplyItems.map((item) => {
              const isCritical = item.remainingQuantity <= item.totalQuantity * 0.2;
              return (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-50">{item.name}</p>
                        <Badge variant={isCritical ? "warning" : "default"}>{isCritical ? "Crítico" : "OK"}</Badge>
                      </div>
                      <p className="text-sm text-zinc-400">{item.category}</p>
                      <p className="text-sm text-zinc-400">{item.remainingQuantity} / {item.totalQuantity} {supplyUnitLabels[item.unit]}</p>
                      <p className="text-sm text-zinc-400">{formatCurrencyBRL(item.unitCost)} por {supplyUnitLabels[item.unit]}</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                      <p className="text-sm text-zinc-400">{formatDateBR(item.purchaseDate)}</p>
                      <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => openAdjustmentSheet({ itemKind: "supply", itemId: item.id, itemName: item.name, currentRemaining: item.remainingQuantity })}>
                        <Replace className="size-4" />
                        Ajustar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }) : <EmptyState icon={PaintBucket} title="Nenhum insumo cadastrado" description="Cadastre primer, tinta, verniz ou embalagem para fechar o custo da peça." />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Movimentações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={movementFilters.month} onValueChange={(value) => setMovementFilters((current) => ({ ...current, month: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{movementMonths.map((month) => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de item</Label>
              <Select value={movementFilters.itemKind} onValueChange={(value) => setMovementFilters((current) => ({ ...current, itemKind: value as StockMovementFilters["itemKind"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="filament">Filamentos</SelectItem><SelectItem value="supply">Insumos</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Movimento</Label>
              <Select value={movementFilters.movementKind} onValueChange={(value) => setMovementFilters((current) => ({ ...current, movementKind: value as StockMovementFilters["movementKind"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(movementKindLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {movementFeed.length ? movementFeed.map((movement) => (
            <div key={movement.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-50">{movement.itemName}</p>
                    <Badge variant={movement.movementKind === "waste" ? "danger" : movement.movementKind === "adjustment" ? "warning" : "muted"}>{movementKindLabels[movement.movementKind]}</Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{movement.itemCategory ?? "Sem categoria"} • {formatDateBR(movement.occurredAt)}</p>
                  <p className="text-sm text-zinc-400">{movement.quantity > 0 ? "+" : ""}{movement.quantity} • {formatCurrencyBRL(movement.totalCost)}{movement.productionJobName ? ` • ${movement.productionJobName}` : ""}</p>
                </div>
                <Badge variant="muted">{movement.itemKind === "filament" ? "Filamento" : "Insumo"}</Badge>
              </div>
            </div>
          )) : <EmptyState icon={Boxes} title="Nenhuma movimentação encontrada" description="Entradas, consumos, desperdícios e ajustes aparecem aqui conforme você usa a operação." />}
        </CardContent>
      </Card>

      <Sheet open={Boolean(adjustmentSheet)} onOpenChange={(open) => (!open ? setAdjustmentSheet(null) : null)}>
        {adjustmentSheet ? (
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Ajustar estoque</SheetTitle>
              <SheetDescription>Corrija diferenças físicas sem editar o histórico original de compra.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Item</p>
                <p className="mt-2 font-heading text-2xl text-zinc-50">{adjustmentSheet.itemName}</p>
                <p className="mt-3 text-sm text-zinc-400">Saldo atual: <span className="font-medium text-zinc-50">{adjustmentSheet.currentRemaining}</span></p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Ajuste</Label><Input type="number" step="0.01" value={adjustmentSheet.quantityDelta} onChange={(event) => setAdjustmentSheet((current) => current ? { ...current, quantityDelta: event.target.value } : current)} placeholder="Ex.: -50 ou 120" /></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={adjustmentSheet.occurredAt} onChange={(event) => setAdjustmentSheet((current) => current ? { ...current, occurredAt: event.target.value } : current)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Motivo</Label><Input value={adjustmentSheet.notes} onChange={(event) => setAdjustmentSheet((current) => current ? { ...current, notes: event.target.value } : current)} placeholder="Ex.: conferência física, perda, correção de entrada" /></div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={() => setAdjustmentSheet(null)}>Cancelar</Button>
                <Button type="button" className="flex-1 rounded-2xl" onClick={applyAdjustment}>Aplicar ajuste</Button>
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
