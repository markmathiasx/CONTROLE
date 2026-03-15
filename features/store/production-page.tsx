"use client";

import * as React from "react";
import { AlertTriangle, Boxes, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import type { ProductionFilters } from "@/types/forms";
import { getStoreProductionInsights } from "@/utils/finance";
import { calculateProductionMetrics, getItemUnitCost } from "@/utils/operations";

type MaterialDraft = {
  id: string;
  itemKind: "filament" | "supply";
  itemId: string;
  quantity: number;
  wasteQuantity: number;
};

type ProductionFormState = {
  id?: string;
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

const makeMaterialDraft = (): MaterialDraft => ({
  id: crypto.randomUUID(),
  itemKind: "filament",
  itemId: "",
  quantity: 0,
  wasteQuantity: 0,
});

const initialForm = (): ProductionFormState => ({
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
  materials: [makeMaterialDraft()],
});

function toFormState(snapshot: NonNullable<ReturnType<typeof useFinanceStore.getState>["snapshot"]>, jobId?: string) {
  if (!jobId) {
    return initialForm();
  }

  const job = snapshot.productionJobs.find((item) => item.id === jobId);
  if (!job) {
    return initialForm();
  }

  const usages = snapshot.productionMaterialUsages.filter((usage) => usage.productionJobId === jobId);
  return {
    id: job.id,
    name: job.name,
    client: job.client ?? "",
    date: job.date,
    quantityProduced: job.quantityProduced,
    quantitySold: job.quantitySold,
    status: job.status,
    printHours: job.printHours,
    finishingHours: job.finishingHours,
    additionalManualCost: job.additionalManualCost,
    packagingCost: job.packagingCost,
    salePriceUnit: job.salePriceUnit,
    salePriceTotal: job.salePriceTotal,
    notes: job.notes ?? "",
    materials: usages.length
      ? usages.map((usage) => ({
          id: usage.id,
          itemKind: usage.itemKind,
          itemId: usage.itemId,
          quantity: usage.quantity,
          wasteQuantity: usage.wasteQuantity,
        }))
      : [makeMaterialDraft()],
  };
}

function resolveAvailableQuantity(
  snapshot: NonNullable<ReturnType<typeof useFinanceStore.getState>["snapshot"]>,
  material: MaterialDraft,
  editingJobId?: string,
) {
  if (material.itemKind === "filament") {
    const spool = snapshot.filamentSpools.find((item) => item.id === material.itemId);
    const current = spool?.remainingWeightGrams ?? 0;
    const restored = editingJobId
      ? snapshot.productionMaterialUsages
          .filter((usage) => usage.productionJobId === editingJobId && usage.itemKind === "filament" && usage.itemId === material.itemId)
          .reduce((sum, usage) => sum + usage.quantity + usage.wasteQuantity, 0)
      : 0;
    return current + restored;
  }

  const supply = snapshot.supplyItems.find((item) => item.id === material.itemId);
  const current = supply?.remainingQuantity ?? 0;
  const restored = editingJobId
    ? snapshot.productionMaterialUsages
        .filter((usage) => usage.productionJobId === editingJobId && usage.itemKind === "supply" && usage.itemId === material.itemId)
        .reduce((sum, usage) => sum + usage.quantity + usage.wasteQuantity, 0)
    : 0;
  return current + restored;
}

function getPreview(snapshot: NonNullable<ReturnType<typeof useFinanceStore.getState>["snapshot"]>, form: ProductionFormState) {
  const errors: string[] = [];
  const usages: NonNullable<ReturnType<typeof useFinanceStore.getState>["snapshot"]>["productionMaterialUsages"] = [];

  form.materials.forEach((material) => {
    if (!material.itemId) {
      errors.push("Selecione todos os materiais antes de salvar.");
      return;
    }

    const totalQuantity = material.quantity + material.wasteQuantity;
    if (totalQuantity <= 0) {
      errors.push("Cada material precisa ter consumo ou desperdício maior que zero.");
      return;
    }

    const available = resolveAvailableQuantity(snapshot, material, form.id);
    if (available < totalQuantity) {
      const itemName =
        material.itemKind === "filament"
          ? snapshot.filamentSpools.find((item) => item.id === material.itemId)?.name
          : snapshot.supplyItems.find((item) => item.id === material.itemId)?.name;
      errors.push(`Estoque insuficiente para ${itemName ?? "o item selecionado"}.`);
      return;
    }

    if (material.itemKind === "filament") {
      const spool = snapshot.filamentSpools.find((item) => item.id === material.itemId);
      if (!spool) {
        errors.push("Filamento não encontrado.");
        return;
      }
      usages.push({
        id: material.id,
        workspaceId: snapshot.workspace.id,
        productionJobId: form.id ?? "preview",
        itemKind: "filament" as const,
        itemId: spool.id,
        itemName: spool.name,
        itemCategory: `${spool.material} • ${spool.color}`,
        quantity: material.quantity,
        wasteQuantity: material.wasteQuantity,
        unitCost: getItemUnitCost(spool),
        totalCost: (material.quantity + material.wasteQuantity) * getItemUnitCost(spool),
        createdAt: form.date,
        updatedAt: form.date,
      });
      return;
    }

    const supply = snapshot.supplyItems.find((item) => item.id === material.itemId);
    if (!supply) {
      errors.push("Insumo não encontrado.");
      return;
    }
    usages.push({
      id: material.id,
      workspaceId: snapshot.workspace.id,
      productionJobId: form.id ?? "preview",
      itemKind: "supply" as const,
      itemId: supply.id,
      itemName: supply.name,
      itemCategory: supply.category,
      quantity: material.quantity,
      wasteQuantity: material.wasteQuantity,
      unitCost: getItemUnitCost(supply),
      totalCost: (material.quantity + material.wasteQuantity) * getItemUnitCost(supply),
      createdAt: form.date,
      updatedAt: form.date,
    });
  });

  const metrics = calculateProductionMetrics({
    quantityProduced: form.quantityProduced,
    quantitySold: form.quantitySold,
    printHours: form.printHours,
    finishingHours: form.finishingHours,
    additionalManualCost: form.additionalManualCost,
    packagingCost: form.packagingCost,
    salePriceTotal: form.salePriceTotal,
    settings: snapshot.operationalSettings,
    usages,
  });

  return { errors, usages, metrics };
}

export function ProductionPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const saveProductionJob = useFinanceStore((state) => state.saveProductionJob);
  const deleteProductionJob = useFinanceStore((state) => state.deleteProductionJob);
  const [form, setForm] = React.useState<ProductionFormState>(initialForm);
  const [editingForm, setEditingForm] = React.useState<ProductionFormState | null>(null);
  const [filters, setFilters] = React.useState<ProductionFilters>({
    month: selectedMonth,
    status: "all",
    profitability: "all",
  });

  React.useEffect(() => {
    setFilters((current) => ({ ...current, month: selectedMonth }));
  }, [selectedMonth]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={4} rows={4} />;
  }

  const insights = getStoreProductionInsights(snapshot, filters.month);
  const materialOptions = {
    filament: snapshot.filamentSpools.map((item) => ({ id: item.id, label: `${item.name} (${item.remainingWeightGrams} g)` })),
    supply: snapshot.supplyItems.map((item) => ({ id: item.id, label: `${item.name} (${item.remainingQuantity})` })),
  };
  const resolvedSnapshot = snapshot;
  const preview = getPreview(resolvedSnapshot, form);
  const filteredJobs = insights.jobs
    .filter((job) => (filters.status === "all" ? true : job.status === filters.status))
    .filter((job) =>
      filters.profitability === "all"
        ? true
        : filters.profitability === "profit"
          ? job.grossProfit >= 0
          : job.grossProfit < 0,
    );

  function submitJob(values: ProductionFormState, afterSubmit?: () => void) {
    const currentPreview = getPreview(resolvedSnapshot, values);
    if (!values.name.trim()) {
      toast.error("Informe o nome da peça.");
      return;
    }
    if (currentPreview.errors.length) {
      toast.error(currentPreview.errors[0]);
      return;
    }

    saveProductionJob({
      id: values.id,
      name: values.name,
      client: values.client || undefined,
      date: values.date,
      quantityProduced: values.quantityProduced,
      quantitySold: values.quantitySold,
      status: values.status,
      printHours: values.printHours,
      finishingHours: values.finishingHours,
      additionalManualCost: values.additionalManualCost,
      packagingCost: values.packagingCost,
      salePriceUnit: values.salePriceUnit,
      salePriceTotal: values.salePriceTotal,
      notes: values.notes,
      materials: values.materials.map((material) => ({
        itemKind: material.itemKind,
        itemId: material.itemId,
        quantity: material.quantity,
        wasteQuantity: material.wasteQuantity,
      })),
    });
    toast.success(values.id ? "Produção atualizada." : "Produção salva.");
    afterSubmit?.();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Produção</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Custo real antes de vender, com energia, desperdício e margem.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Printer} label="Energia" value={formatCurrencyBRL(insights.totalEnergyCost)} detail="No mês filtrado" />
        <SummaryCard icon={AlertTriangle} label="Pintura / acabamento" value={formatCurrencyBRL(insights.totalPaintCost)} detail="Só insumos de acabamento" accent="from-cyan-400/20 via-cyan-500/10 to-transparent" />
        <SummaryCard icon={Boxes} label="Custo médio unitário" value={formatCurrencyBRL(insights.averageUnitCost)} detail={`${insights.jobs.length} produção(ões)`} accent="from-violet-400/20 via-violet-500/10 to-transparent" />
        <SummaryCard icon={AlertTriangle} label="Produções com prejuízo" value={`${insights.lossCount}`} detail={`${insights.profitableCount} com lucro`} accent="from-amber-400/20 via-amber-500/10 to-transparent" />
      </div>

      <Card>
        <CardHeader><CardTitle>{form.id ? "Editando produção" : "Nova produção"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2"><Label>Nome da peça</Label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Cliente</Label><Input value={form.client} onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as ProductionFormState["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="budget">Orçamento</SelectItem><SelectItem value="in-production">Em produção</SelectItem><SelectItem value="ready">Pronto</SelectItem><SelectItem value="delivered">Entregue</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Qtde produzida</Label><Input type="number" value={form.quantityProduced} onChange={(event) => setForm((current) => ({ ...current, quantityProduced: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Qtde vendida</Label><Input type="number" value={form.quantitySold} onChange={(event) => setForm((current) => ({ ...current, quantitySold: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Horas de impressão</Label><Input type="number" step="0.1" value={form.printHours} onChange={(event) => setForm((current) => ({ ...current, printHours: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Horas de acabamento</Label><Input type="number" step="0.1" value={form.finishingHours} onChange={(event) => setForm((current) => ({ ...current, finishingHours: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Custo manual extra</Label><Input type="number" step="0.01" value={form.additionalManualCost} onChange={(event) => setForm((current) => ({ ...current, additionalManualCost: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Embalagem</Label><Input type="number" step="0.01" value={form.packagingCost} onChange={(event) => setForm((current) => ({ ...current, packagingCost: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Preço unitário</Label><Input type="number" step="0.01" value={form.salePriceUnit} onChange={(event) => setForm((current) => ({ ...current, salePriceUnit: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label>Preço total</Label><Input type="number" step="0.01" value={form.salePriceTotal} onChange={(event) => setForm((current) => ({ ...current, salePriceTotal: Number(event.target.value) }))} /></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Materiais usados</Label>
              <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, materials: [...current.materials, makeMaterialDraft()] }))}>
                <Plus className="size-4" />
                Adicionar material
              </Button>
            </div>

            {form.materials.map((material) => (
              <div key={material.id} className="grid gap-3 rounded-2xl border border-white/8 bg-white/6 p-4 md:grid-cols-4 xl:grid-cols-5">
                <div className="space-y-2"><Label>Tipo</Label><Select value={material.itemKind} onValueChange={(value) => setForm((current) => ({ ...current, materials: current.materials.map((item) => item.id === material.id ? { ...item, itemKind: value as MaterialDraft["itemKind"], itemId: "" } : item) }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="filament">Filamento</SelectItem><SelectItem value="supply">Insumo</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Item</Label><Select value={material.itemId} onValueChange={(value) => setForm((current) => ({ ...current, materials: current.materials.map((item) => item.id === material.id ? { ...item, itemId: value } : item) }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{materialOptions[material.itemKind].map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Quantidade</Label><Input type="number" step="0.01" value={material.quantity} onChange={(event) => setForm((current) => ({ ...current, materials: current.materials.map((item) => item.id === material.id ? { ...item, quantity: Number(event.target.value) } : item) }))} /></div>
                <div className="space-y-2"><Label>Desperdício</Label><Input type="number" step="0.01" value={material.wasteQuantity} onChange={(event) => setForm((current) => ({ ...current, materials: current.materials.map((item) => item.id === material.id ? { ...item, wasteQuantity: Number(event.target.value) } : item) }))} /></div>
                <div className="flex items-end"><Button type="button" variant="ghost" className="w-full rounded-2xl" onClick={() => setForm((current) => ({ ...current, materials: current.materials.length === 1 ? current.materials : current.materials.filter((item) => item.id !== material.id) }))}><Trash2 className="size-4" /></Button></div>
              </div>
            ))}
          </div>

          <div className="space-y-2"><Label>Observações</Label><Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Material</p><p className="mt-2 font-heading text-xl text-zinc-50">{formatCurrencyBRL(preview.metrics.materialCost)}</p></div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Desperdício</p><p className="mt-2 font-heading text-xl text-zinc-50">{preview.metrics.totalWasteQuantity} g • {formatCurrencyBRL(preview.metrics.wasteCost)}</p></div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Energia + pintura</p><p className="mt-2 font-heading text-xl text-zinc-50">{formatCurrencyBRL(preview.metrics.energyCost + preview.metrics.paintCost)}</p></div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Lucro / prejuízo</p><p className={`mt-2 font-heading text-xl ${preview.metrics.grossProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrencyBRL(preview.metrics.grossProfit)}</p></div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <p className="text-sm text-zinc-300">Custo total: <span className="font-medium text-zinc-50">{formatCurrencyBRL(preview.metrics.totalCost)}</span></p>
              <p className="text-sm text-zinc-300">Custo unitário: <span className="font-medium text-zinc-50">{formatCurrencyBRL(preview.metrics.unitCost)}</span></p>
              <p className="text-sm text-zinc-300">Pintura: <span className="font-medium text-zinc-50">{formatCurrencyBRL(preview.metrics.paintCost)}</span></p>
              <p className="text-sm text-zinc-300">Margem: <span className="font-medium text-zinc-50">{preview.metrics.marginPercent}%</span></p>
            </div>
            {preview.errors.length ? <div className="mt-3 space-y-2">{preview.errors.map((error) => <p key={error} className="text-sm text-rose-300">{error}</p>)}</div> : null}
          </div>

          <div className="flex gap-3">
            {form.id ? (
              <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={() => { setForm(initialForm()); setEditingForm(null); }}>
                Cancelar edição
              </Button>
            ) : null}
            <Button className="flex-1 rounded-2xl" disabled={!form.name.trim() || preview.errors.length > 0} onClick={() => submitJob(form, () => { setForm(initialForm()); setEditingForm(null); })}>
              {form.id ? "Atualizar produção" : "Salvar produção"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Produções do período</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label>Status</Label><Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value as ProductionFilters["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="budget">Orçamento</SelectItem><SelectItem value="in-production">Em produção</SelectItem><SelectItem value="ready">Pronto</SelectItem><SelectItem value="delivered">Entregue</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Resultado</Label><Select value={filters.profitability} onValueChange={(value) => setFilters((current) => ({ ...current, profitability: value as ProductionFilters["profitability"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="profit">Com lucro</SelectItem><SelectItem value="loss">Com prejuízo</SelectItem></SelectContent></Select></div>
          </div>

          {filteredJobs.length ? filteredJobs.map((job) => (
            <button type="button" key={job.id} className="w-full rounded-2xl border border-white/8 bg-white/6 p-4 text-left transition hover:border-emerald-400/30 hover:bg-white/8" onClick={() => { const nextForm = toFormState(resolvedSnapshot, job.id); setForm(nextForm); setEditingForm(nextForm); }}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-50">{job.name}</p>
                    <Badge variant="muted">{job.status}</Badge>
                    <Badge variant={job.grossProfit >= 0 ? "default" : "danger"}>{job.grossProfit >= 0 ? "Lucro" : "Prejuízo"}</Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{formatDateBR(job.date)} • {job.quantityProduced} un • {job.quantitySold} vendida(s)</p>
                  <p className="text-sm text-zinc-400">Energia {formatCurrencyBRL(job.energyCost)} • Pintura {formatCurrencyBRL(job.paintCost ?? 0)} • Desperdício {formatCurrencyBRL(job.wasteCost)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-50">{formatCurrencyBRL(job.totalCost)}</p>
                  <p className={`text-sm ${job.grossProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrencyBRL(job.grossProfit)}</p>
                </div>
              </div>
            </button>
          )) : <EmptyState icon={Printer} title="Nenhuma produção encontrada" description="Ajuste os filtros ou registre a primeira peça para calcular custo, desperdício e margem." />}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editingForm)} onOpenChange={(open) => (!open ? setEditingForm(null) : null)}>
        {editingForm ? (
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar produção</SheetTitle>
              <SheetDescription>Esta produção já foi carregada no editor acima com preview, estoque e custo recalculados em tempo real.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
                <p className="text-sm text-zinc-400">Produção selecionada</p>
                <p className="mt-2 font-heading text-2xl text-zinc-50">{editingForm.name}</p>
              </div>
              <Button className="w-full rounded-2xl" onClick={() => setEditingForm(null)}>
                Fechar painel
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                onClick={() => {
                  deleteProductionJob(editingForm.id!);
                  toast.success("Produção excluída.");
                  setEditingForm(null);
                }}
              >
                Excluir produção
              </Button>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
