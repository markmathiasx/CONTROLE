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
  client: "",
  productName: "",
  quantity: 1,
  date: new Date().toISOString().slice(0, 10),
  status: "budget" as const,
  unitPrice: 0,
  totalPrice: 0,
  notes: "",
  linkedProductionJobId: "",
};

export function OrdersPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const saveStoreOrder = useFinanceStore((state) => state.saveStoreOrder);
  const [form, setForm] = React.useState(initialForm);

  if (!initialized || !snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Pedidos</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Registre vendas e reconheça receita só na entrega.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo pedido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={form.client} onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Produto</Label>
            <Input value={form.productName} onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} />
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
            <Label>Preço unitário</Label>
            <Input type="number" step="0.01" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Total</Label>
            <Input type="number" step="0.01" value={form.totalPrice} onChange={(event) => setForm((current) => ({ ...current, totalPrice: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Produção vinculada</Label>
            <Select value={form.linkedProductionJobId} onValueChange={(value) => setForm((current) => ({ ...current, linkedProductionJobId: value === "none" ? "" : value }))}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {snapshot.productionJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 xl:col-span-4">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="xl:col-span-4">
            <Button
              className="w-full rounded-2xl"
              onClick={() => {
                saveStoreOrder(form);
                toast.success("Pedido salvo.");
                setForm(initialForm);
              }}
            >
              Salvar pedido
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.storeOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-50">{order.productName}</p>
                  <p className="text-sm text-zinc-400">
                    {order.client ?? "Sem cliente"} • {formatDateBR(order.date)} • {order.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-50">{formatCurrencyBRL(order.totalPrice)}</p>
                  <p className="text-sm text-zinc-400">Lucro {formatCurrencyBRL(order.grossProfit)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
