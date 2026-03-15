"use client";

import * as React from "react";
import { ReceiptText } from "lucide-react";
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
import { storeOrderStatusLabels } from "@/lib/constants";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { formatMonthKey } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import type { OrderFilters, StoreOrderFormValues } from "@/types/forms";
import { getProfitByProduct } from "@/utils/finance";

const initialForm: StoreOrderFormValues = {
  client: "",
  productName: "",
  quantity: 1,
  date: new Date().toISOString().slice(0, 10),
  status: "budget",
  unitPrice: 0,
  totalPrice: 0,
  notes: "",
  linkedProductionJobId: "",
};

function OrderForm({
  value,
  productionOptions,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  value: StoreOrderFormValues;
  productionOptions: Array<{ id: string; name: string; unitCost: number }>;
  onChange: React.Dispatch<React.SetStateAction<StoreOrderFormValues>>;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const linkedProduction = productionOptions.find((option) => option.id === value.linkedProductionJobId);
  const totalPrice = value.totalPrice || value.unitPrice * value.quantity;
  const totalCost = linkedProduction ? linkedProduction.unitCost * value.quantity : 0;
  const grossProfit = totalPrice - totalCost;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2"><Label>Cliente</Label><Input value={value.client ?? ""} onChange={(event) => onChange((current) => ({ ...current, client: event.target.value }))} /></div>
        <div className="space-y-2"><Label>Produto</Label><Input value={value.productName} onChange={(event) => onChange((current) => ({ ...current, productName: event.target.value }))} /></div>
        <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={value.quantity} onChange={(event) => onChange((current) => ({ ...current, quantity: Number(event.target.value) }))} /></div>
        <div className="space-y-2"><Label>Data</Label><Input type="date" value={value.date} onChange={(event) => onChange((current) => ({ ...current, date: event.target.value }))} /></div>
        <div className="space-y-2"><Label>Status</Label><Select value={value.status} onValueChange={(next) => onChange((current) => ({ ...current, status: next as StoreOrderFormValues["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(storeOrderStatusLabels).map(([status, label]) => <SelectItem key={status} value={status}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Preço unitário</Label><Input type="number" step="0.01" value={value.unitPrice} onChange={(event) => onChange((current) => ({ ...current, unitPrice: Number(event.target.value) }))} /></div>
        <div className="space-y-2"><Label>Total</Label><Input type="number" step="0.01" value={value.totalPrice} onChange={(event) => onChange((current) => ({ ...current, totalPrice: Number(event.target.value) }))} /></div>
        <div className="space-y-2"><Label>Produção vinculada</Label><Select value={value.linkedProductionJobId ?? "none"} onValueChange={(next) => onChange((current) => ({ ...current, linkedProductionJobId: next === "none" ? "" : next }))}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent><SelectItem value="none">Sem vínculo</SelectItem>{productionOptions.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2 xl:col-span-4"><Label>Observações</Label><Input value={value.notes ?? ""} onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))} /></div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Receita</p><p className="mt-2 font-heading text-xl text-zinc-50">{formatCurrencyBRL(totalPrice)}</p></div>
        <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Custo snapshot</p><p className="mt-2 font-heading text-xl text-zinc-50">{formatCurrencyBRL(totalCost)}</p></div>
        <div className="rounded-2xl border border-white/8 bg-white/6 p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Resultado</p><p className={`mt-2 font-heading text-xl ${grossProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrencyBRL(grossProfit)}</p></div>
      </div>

      <div className="flex gap-3">
        {onCancel ? <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={onCancel}>Cancelar</Button> : null}
        <Button type="button" className="flex-1 rounded-2xl" onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const saveStoreOrder = useFinanceStore((state) => state.saveStoreOrder);
  const deleteStoreOrder = useFinanceStore((state) => state.deleteStoreOrder);
  const [form, setForm] = React.useState<StoreOrderFormValues>(initialForm);
  const [editingForm, setEditingForm] = React.useState<StoreOrderFormValues | null>(null);
  const [filters, setFilters] = React.useState<OrderFilters>({ month: selectedMonth, status: "all", query: "" });

  React.useEffect(() => {
    setFilters((current) => ({ ...current, month: selectedMonth }));
  }, [selectedMonth]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={4} rows={3} />;
  }

  const productionOptions = snapshot.productionJobs.map((job) => ({ id: job.id, name: job.name, unitCost: job.unitCost }));
  const deliveredOrders = snapshot.storeOrders.filter((order) => formatMonthKey(order.date) === filters.month && order.status === "delivered");
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalProfit = deliveredOrders.reduce((sum, order) => sum + order.grossProfit, 0);
  const filteredOrders = snapshot.storeOrders
    .filter((order) => formatMonthKey(order.date) === filters.month)
    .filter((order) => (filters.status === "all" ? true : order.status === filters.status))
    .filter((order) =>
      filters.query
        ? `${order.productName} ${order.client ?? ""}`.toLowerCase().includes(filters.query.toLowerCase())
        : true,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const topProducts = getProfitByProduct(snapshot, filters.month).slice(0, 3);

  function submitOrder(values: StoreOrderFormValues, afterSubmit?: () => void) {
    if (!values.productName.trim()) {
      toast.error("Informe o produto.");
      return;
    }
    saveStoreOrder(values);
    toast.success(values.id ? "Pedido atualizado." : "Pedido salvo.");
    afterSubmit?.();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Pedidos</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Venda, custo snapshot e reconhecimento de receita só na entrega.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={ReceiptText} label="Pedidos do mês" value={`${filteredOrders.length}`} detail="Após filtros aplicados" />
        <SummaryCard icon={ReceiptText} label="Entregues" value={`${deliveredOrders.length}`} detail="Receita reconhecida" accent="from-cyan-400/20 via-cyan-500/10 to-transparent" />
        <SummaryCard icon={ReceiptText} label="Faturamento" value={formatCurrencyBRL(totalRevenue)} detail="Só pedidos entregues" accent="from-emerald-400/20 via-emerald-500/10 to-transparent" />
        <SummaryCard icon={ReceiptText} label="Lucro bruto" value={formatCurrencyBRL(totalProfit)} detail={topProducts[0] ? `Top: ${topProducts[0].productName}` : "Sem ranking"} accent="from-violet-400/20 via-violet-500/10 to-transparent" />
      </div>

      <Card>
        <CardHeader><CardTitle>Novo pedido</CardTitle></CardHeader>
        <CardContent>
          <OrderForm value={form} productionOptions={productionOptions} onChange={setForm} onSubmit={() => submitOrder(form, () => setForm(initialForm))} submitLabel="Salvar pedido" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pedidos cadastrados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label>Status</Label><Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value as OrderFilters["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(storeOrderStatusLabels).map(([status, label]) => <SelectItem key={status} value={status}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Busca</Label><Input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Cliente ou produto" /></div>
          </div>

          {filteredOrders.length ? filteredOrders.map((order) => (
            <button type="button" key={order.id} className="w-full rounded-2xl border border-white/8 bg-white/6 p-4 text-left transition hover:border-cyan-400/30 hover:bg-white/8" onClick={() => setEditingForm({
              id: order.id,
              client: order.client ?? "",
              productName: order.productName,
              quantity: order.quantity,
              date: order.date,
              status: order.status,
              unitPrice: order.unitPrice,
              totalPrice: order.totalPrice,
              notes: order.notes ?? "",
              linkedProductionJobId: order.linkedProductionJobId ?? "",
            })}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-50">{order.productName}</p>
                    <Badge variant="muted">{storeOrderStatusLabels[order.status]}</Badge>
                    <Badge variant={order.grossProfit >= 0 ? "default" : "danger"}>{order.grossProfit >= 0 ? "Lucro" : "Prejuízo"}</Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{order.client ?? "Sem cliente"} • {formatDateBR(order.date)} • {order.quantity} un</p>
                  <p className="text-sm text-zinc-400">Custo {formatCurrencyBRL(order.totalCostSnapshot)} • Resultado {formatCurrencyBRL(order.grossProfit)}</p>
                </div>
                <p className="font-semibold text-zinc-50">{formatCurrencyBRL(order.totalPrice)}</p>
              </div>
            </button>
          )) : <EmptyState icon={ReceiptText} title="Nenhum pedido encontrado" description="Ajuste os filtros ou cadastre o primeiro pedido para acompanhar venda, produção e receita." />}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editingForm)} onOpenChange={(open) => (!open ? setEditingForm(null) : null)}>
        {editingForm ? (
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar pedido</SheetTitle>
              <SheetDescription>
                O pedido continua separado da produção e a receita só entra no financeiro quando o status for entregue.
              </SheetDescription>
            </SheetHeader>
            <OrderForm
              value={editingForm}
              productionOptions={productionOptions}
              onChange={(updater) =>
                setEditingForm((current) =>
                  typeof updater === "function" ? updater(current ?? initialForm) : updater,
                )
              }
              onSubmit={() => submitOrder(editingForm, () => setEditingForm(null))}
              submitLabel="Salvar alterações"
              onCancel={() => setEditingForm(null)}
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              onClick={() => {
                deleteStoreOrder(editingForm.id!);
                toast.success("Pedido excluído.");
                setEditingForm(null);
              }}
            >
              Excluir pedido
            </Button>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
