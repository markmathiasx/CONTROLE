"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/shared/chart-card";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyBRL, formatDateBR, formatMonthShortLabel } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  calculateFuelTotals,
  calculateMaintenanceTotals,
  getConsolidatedSummary,
  getExpenseHighlights,
  getFutureInstallmentsByMonth,
  getMonthlyEvolution,
  getProfitByProduct,
  getSpendByCategory,
  getSpendByCenter,
  getSpendByPaymentMethod,
  getStoreDashboardSummary,
} from "@/utils/finance";

export function ReportsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);

  if (!initialized || !snapshot) {
    return null;
  }

  const highlights = getExpenseHighlights(snapshot, selectedMonth);
  const paymentMethodData = getSpendByPaymentMethod(snapshot, selectedMonth);
  const centerData = getSpendByCenter(snapshot, selectedMonth);
  const categoryData = getSpendByCategory(snapshot, selectedMonth).slice(0, 8);
  const monthlyEvolution = getMonthlyEvolution(snapshot, 6);
  const futureInstallments = getFutureInstallmentsByMonth(snapshot, selectedMonth, 6);
  const fuel = calculateFuelTotals(snapshot, selectedMonth);
  const maintenance = calculateMaintenanceTotals(snapshot, selectedMonth);
  const store = getStoreDashboardSummary(snapshot, selectedMonth);
  const consolidated = getConsolidatedSummary(snapshot, selectedMonth);
  const profitByProduct = getProfitByProduct(snapshot, selectedMonth).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Relatórios úteis</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Financeiro, moto, loja e consolidado sem misturar tudo.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="moto">Moto</TabsTrigger>
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Cigarro", highlights.smoke],
              ["Bebidas", highlights.drinks],
              ["Ervas", highlights.weeds],
              ["Crédito", highlights.credit],
              ["VR", highlights.vr],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                  <p className="font-heading text-2xl font-semibold text-zinc-50">
                    {formatCurrencyBRL(Number(value))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Gastos por categoria" description="Top categorias do mês selecionado.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.map((item) => ({ name: item.category?.name ?? "Categoria", total: item.total }))}>
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10b981" radius={[14, 14, 0, 0]}>
                      {categoryData.map((item) => (
                        <Cell key={item.category?.id ?? item.total} fill={item.category?.color ?? "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Gastos por centro" description="Pessoal, casal, moto e loja lado a lado.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centerData.map((item) => ({ name: item.center?.name ?? "Centro", total: item.total }))}>
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#06b6d4" radius={[14, 14, 0, 0]}>
                      {centerData.map((item) => (
                        <Cell key={item.center?.id ?? item.total} fill={item.center?.color ?? "#06b6d4"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Forma de pagamento" description="Como o dinheiro saiu neste mês.">
              <div className="space-y-3">
                {paymentMethodData.map((item) => (
                  <div key={item.paymentMethod} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-sm text-zinc-200">{item.label}</p>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.total)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Parcelas futuras por mês" description="Comprometimento do cartão nos próximos meses.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={futureInstallments.map((item) => ({ month: formatMonthShortLabel(item.month), total: item.total }))}>
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="moto" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Gasolina</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(fuel.totalCost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Litros</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{fuel.totalLiters} L</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Manutenção</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(maintenance.totalCost)}</p></CardContent></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Abastecimentos" description="Histórico do período.">
              <div className="space-y-3">
                {fuel.logs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.station ?? "Abastecimento"}</p>
                      <p className="text-xs text-zinc-400">{item.date} • {item.odometerKm} km</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Manutenção por categoria" description="Onde a moto mais consumiu.">
              <div className="space-y-3">
                {Object.entries(maintenance.byCategory).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <p className="text-sm text-zinc-100">{key}</p>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(value)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="loja" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Faturamento</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(store.revenue)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Custo</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(store.cost)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Lucro</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(store.grossProfit)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Margem</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{store.averageMargin}%</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Desperdício</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{store.wasteGrams} g</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Estoque crítico</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{store.criticalStockCount}</p></CardContent></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Produtos mais lucrativos" description="Lucro por pedido/produto no mês.">
              <div className="space-y-3">
                {profitByProduct.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.productName}</p>
                      <p className="text-xs text-zinc-400">Margem {item.marginPercent}%</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.grossProfit)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Produções recentes" description="Custos mais recentes da operação.">
              <div className="space-y-3">
                {store.recentJobs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{item.name}</p>
                      <p className="text-xs text-zinc-400">{formatDateBR(item.date)} • {item.quantityProduced} un</p>
                    </div>
                    <p className="font-medium text-zinc-50">{formatCurrencyBRL(item.totalCost)}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="consolidado" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Receita total</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.incomeTotal)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Despesa total</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.expenseTotal)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Operacional</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.operationalExpense)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Saldo líquido</p><p className="mt-2 font-heading text-2xl font-semibold text-zinc-50">{formatCurrencyBRL(consolidated.net)}</p></CardContent></Card>
          </div>

          <ChartCard title="Comparativo mês a mês" description="Receita, gasto e fatura nos últimos meses.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyEvolution.map((item) => ({
                    month: formatMonthShortLabel(item.month),
                    receita: item.income,
                    gasto: item.spent,
                    fatura: item.invoice,
                  }))}
                >
                  <XAxis dataKey="month" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip />
                  <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="gasto" stroke="#06b6d4" strokeWidth={3} />
                  <Line type="monotone" dataKey="fatura" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
