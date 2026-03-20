"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  CreditCard,
  Filter,
  Link2,
  Wallet,
} from "lucide-react";

import { DeltaPill } from "@/components/shared/delta-pill";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { TransactionList } from "@/components/shared/transaction-list";
import { SummaryCard } from "@/components/shared/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCompactCurrencyBRL, formatCurrencyBRL } from "@/lib/formatters";
import { mergeSearchParams } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import { listUnifiedEntries } from "@/utils/finance";

export function TransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const [search, setSearch] = React.useState(() => searchParams.get("search") ?? "");
  const [kindFilter, setKindFilter] = React.useState<"all" | "expense" | "income">(
    () => (searchParams.get("kind") as "all" | "expense" | "income" | null) ?? "all",
  );
  const [centerFilter, setCenterFilter] = React.useState<string>(
    () => searchParams.get("center") ?? "all",
  );
  const [paymentFilter, setPaymentFilter] = React.useState<string>(
    () => searchParams.get("payment") ?? "all",
  );
  const [moduleFilter, setModuleFilter] = React.useState<string>(
    () => searchParams.get("module") ?? "all",
  );
  const [vehicleFilter, setVehicleFilter] = React.useState<string>(
    () => searchParams.get("vehicle") ?? "all",
  );
  const [linkedFilter, setLinkedFilter] = React.useState<"all" | "linked" | "manual">(
    () => (searchParams.get("linked") as "all" | "linked" | "manual" | null) ?? "all",
  );
  const deferredSearch = React.useDeferredValue(search);

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const query = mergeSearchParams(searchParams, updates);
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const nextSearch = searchParams.get("search") ?? "";
    const nextKind = (searchParams.get("kind") as "all" | "expense" | "income" | null) ?? "all";
    const nextCenter = searchParams.get("center") ?? "all";
    const nextPayment = searchParams.get("payment") ?? "all";
    const nextModule = searchParams.get("module") ?? "all";
    const nextVehicle = searchParams.get("vehicle") ?? "all";
    const nextLinked = (searchParams.get("linked") as "all" | "linked" | "manual" | null) ?? "all";

    if (nextSearch !== search) setSearch(nextSearch);
    if (nextKind !== kindFilter) setKindFilter(nextKind);
    if (nextCenter !== centerFilter) setCenterFilter(nextCenter);
    if (nextPayment !== paymentFilter) setPaymentFilter(nextPayment);
    if (nextModule !== moduleFilter) setModuleFilter(nextModule);
    if (nextVehicle !== vehicleFilter) setVehicleFilter(nextVehicle);
    if (nextLinked !== linkedFilter) setLinkedFilter(nextLinked);
  }, [
    centerFilter,
    kindFilter,
    linkedFilter,
    moduleFilter,
    paymentFilter,
    search,
    searchParams,
    vehicleFilter,
  ]);

  React.useEffect(() => {
    if (
      initialized &&
      snapshot &&
      vehicleFilter !== "all" &&
      snapshot.vehicles.length &&
      !snapshot.vehicles.some((vehicle) => vehicle.id === vehicleFilter)
    ) {
      setVehicleFilter("all");
      updateQuery({ vehicle: null });
    }
  }, [initialized, snapshot, updateQuery, vehicleFilter]);

  const transactionItems = snapshot?.transactions ?? [];
  const incomeItems = snapshot?.incomes ?? [];

  const allEntries = React.useMemo(
    () => (snapshot ? listUnifiedEntries(snapshot, selectedMonth) : []),
    [selectedMonth, snapshot],
  );
  const filteredEntries = React.useMemo(() => allEntries.filter((entry) => {
    const paymentMatches =
      paymentFilter === "all"
        ? true
        : entry.kind === "expense"
          ? entry.paymentMethod === paymentFilter
          : false;
    const moduleMatches = moduleFilter === "all" ? true : entry.originModule === moduleFilter;
    const linkedMatches =
      linkedFilter === "all"
        ? true
        : linkedFilter === "linked"
          ? (entry.kind === "expense"
              ? transactionItems.find((item) => item.id === entry.id)?.lockedByOrigin
              : incomeItems.find((item) => item.id === entry.id)?.lockedByOrigin) === true
          : (entry.kind === "expense"
              ? transactionItems.find((item) => item.id === entry.id)?.lockedByOrigin
              : incomeItems.find((item) => item.id === entry.id)?.lockedByOrigin) !== true;

    return (
      (kindFilter === "all" ? true : entry.kind === kindFilter) &&
      (centerFilter === "all" ? true : entry.centerId === centerFilter) &&
      paymentMatches &&
      moduleMatches &&
      (vehicleFilter === "all" ? true : entry.vehicleId === vehicleFilter) &&
      linkedMatches
    );
  }), [allEntries, centerFilter, incomeItems, kindFilter, linkedFilter, moduleFilter, paymentFilter, transactionItems, vehicleFilter]);

  const selectedVehicle =
    vehicleFilter === "all"
      ? null
      : snapshot?.vehicles.find((vehicle) => vehicle.id === vehicleFilter) ?? null;

  const expenseTotal = filteredEntries
    .filter((entry) => entry.kind === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const incomeTotal = filteredEntries
    .filter((entry) => entry.kind === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const creditTotal = filteredEntries
    .filter((entry) => entry.kind === "expense" && entry.paymentMethod === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const vehicleExpenseTotal = filteredEntries
    .filter((entry) => entry.kind === "expense" && entry.vehicleId)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const vehicleLinkedCount = filteredEntries.filter((entry) => Boolean(entry.vehicleId)).length;
  const linkedCount = filteredEntries.filter((entry) =>
    entry.kind === "expense"
      ? transactionItems.find((item) => item.id === entry.id)?.lockedByOrigin
      : incomeItems.find((item) => item.id === entry.id)?.lockedByOrigin,
  ).length;

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={3} rows={1} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Feed completo</p>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Pesquise, filtre e ajuste tudo do mês.
          </h1>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ArrowUpDown}
          label="Movimentações filtradas"
          value={`${filteredEntries.length}`}
          detail={`Entradas ${formatCurrencyBRL(incomeTotal)} • saídas ${formatCurrencyBRL(expenseTotal)}`}
          badge={{ text: "Feed" }}
        />
        <SummaryCard
          icon={Wallet}
          label="Saldo líquido"
          value={formatCurrencyBRL(incomeTotal - expenseTotal)}
          detail="Dentro dos filtros aplicados"
          badge={{
            text: incomeTotal - expenseTotal >= 0 ? "Saudável" : "Pressão",
            tone: incomeTotal - expenseTotal >= 0 ? "default" : "warning",
          }}
          accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
        />
        <SummaryCard
          icon={CreditCard}
          label="Crédito no recorte"
          value={formatCurrencyBRL(creditTotal)}
          detail="Ajuda a separar caixa de fatura"
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
        <SummaryCard
          icon={Link2}
          label="Itens vinculados"
          value={`${linkedCount}`}
          detail="Automóvel, loja e automações com origem travada"
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={Link2}
          label={selectedVehicle ? "Veículo no filtro" : "Automóvel rastreado"}
          value={formatCurrencyBRL(vehicleExpenseTotal)}
          detail={
            selectedVehicle
              ? `${selectedVehicle.nickname} • ${vehicleLinkedCount} item(ns)`
              : `${vehicleLinkedCount} lançamento(s) com vínculo de veículo`
          }
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Busca e filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Procure por descrição, data ou contexto"
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              updateQuery({ search: value || null });
            }}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Tipo</p>
              <Select
                value={kindFilter}
                onValueChange={(value) => {
                  setKindFilter(value as typeof kindFilter);
                  updateQuery({ kind: value === "all" ? null : value });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Centro</p>
              <Select
                value={centerFilter}
                onValueChange={(value) => {
                  setCenterFilter(value);
                  updateQuery({ center: value === "all" ? null : value });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {snapshot.costCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Pagamento</p>
              <Select
                value={paymentFilter}
                onValueChange={(value) => {
                  setPaymentFilter(value);
                  updateQuery({ payment: value === "all" ? null : value });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="vr">VR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Origem</p>
              <Select
                value={moduleFilter}
                onValueChange={(value) => {
                  setModuleFilter(value);
                  updateQuery({ module: value === "all" ? null : value });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="moto">Automóvel</SelectItem>
                  <SelectItem value="store">Loja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Veículo</p>
              <Select
                value={vehicleFilter}
                onValueChange={(value) => {
                  setVehicleFilter(value);
                  updateQuery({ vehicle: value === "all" ? null : value });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {snapshot.vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Vínculo</p>
              <Select
                value={linkedFilter}
                onValueChange={(value) => {
                  setLinkedFilter(value as typeof linkedFilter);
                  updateQuery({ linked: value === "all" ? null : value });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="linked">Só vinculados</SelectItem>
                  <SelectItem value="manual">Só manuais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DeltaPill
              delta={incomeTotal - expenseTotal}
              goodWhenPositive
              text={`Saldo do filtro ${formatCompactCurrencyBRL(incomeTotal - expenseTotal)}`}
            />
            <Button
              type="button"
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                setSearch("");
                setKindFilter("all");
                setCenterFilter("all");
                setPaymentFilter("all");
                setModuleFilter("all");
                setVehicleFilter("all");
                setLinkedFilter("all");
                updateQuery({
                  search: null,
                  kind: null,
                  center: null,
                  payment: null,
                  module: null,
                  vehicle: null,
                  linked: null,
                });
              }}
            >
              <Filter className="size-4" />
              Limpar filtros
            </Button>
            <Button asChild variant="secondary" className="rounded-2xl">
              <Link href="/transacoes/nova">Novo lançamento</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <TransactionList
        snapshot={snapshot}
        monthKey={selectedMonth}
        search={deferredSearch}
        entries={filteredEntries}
      />
    </div>
  );
}
