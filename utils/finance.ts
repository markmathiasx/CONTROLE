import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  compareAsc,
  compareDesc,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDate,
  getYear,
  isAfter,
  isBefore,
  isEqual,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import { maintenanceCategoryLabels, paymentMethodLabels } from "@/lib/constants";
import { formatCurrencyBRL } from "@/lib/formatters";
import { formatMonthKey, listMonthKeys, roundCurrency } from "@/lib/utils";
import type {
  CardInvoice,
  EntryKind,
  Income,
  MaintenanceReminder,
  PaymentMethod,
  RecurrenceRule,
  StockItemKind,
  StockMovementKind,
  WorkspaceSnapshot,
} from "@/types/domain";

export interface UnifiedEntry {
  id: string;
  kind: EntryKind;
  description: string;
  amount: number;
  date: string;
  centerId: string;
  categoryId?: string | null;
  paymentMethod?: PaymentMethod | null;
  incomeType?: Income["incomeType"];
  originModule?: "finance" | "moto" | "store";
  originRefId?: string | null;
  vehicleId?: string | null;
  vehicleName?: string | null;
}

export interface MaterializedOccurrence {
  id: string;
  recurrenceRuleId: string;
  kind: EntryKind;
  date: string;
  description: string;
  amount: number;
  centerId: string;
  categoryId?: string | null;
  paymentMethod?: PaymentMethod | null;
  wallet?: Income["wallet"] | null;
  incomeType?: Income["incomeType"] | null;
}

export interface AlertItem {
  id: string;
  tone: "warning" | "critical";
  module: "finance" | "moto" | "store" | "shared";
  title: string;
  body: string;
}

export interface AutomationItem {
  id: string;
  module: "finance" | "moto" | "store";
  tone: "info" | "warning" | "critical";
  title: string;
  body: string;
  date?: string | null;
  dueKm?: number | null;
}

export interface RecurrenceInsights {
  activeRules: number;
  incomeRules: number;
  expenseRules: number;
  endingSoonCount: number;
  upcomingCount: number;
  nextOccurrences: MaterializedOccurrence[];
}

export interface DeltaMetric {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  trend: "up" | "down" | "flat";
}

export type VehicleScopeValue = string | "all";
export type ReportPeriod = "day" | "week" | "month" | "year";
export type PrintableReportStyle = "neutral" | "economy" | "operational";

export interface VehicleFixedCostAgendaItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  kind: "ipva" | "insurance" | "licensing" | "maintenance";
  title: string;
  amount: number;
  dueDate?: string | null;
  dueKm?: number | null;
  isOverdue: boolean;
}

export interface VehiclePerformanceEntry {
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  monthlyCost: number;
  fuelCost: number;
  maintenanceCost: number;
  annualFixedCost: number;
  liters: number;
  distanceKm: number;
  kmPerLiter: number;
  costPerKm: number;
  reminders: number;
}

export interface PrintableSpendingReport {
  style: PrintableReportStyle;
  headline: string;
  period: ReportPeriod;
  periodLabel: string;
  anchorDate: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  topCategories: Array<{ label: string; total: number; share: number }>;
  topCenters: Array<{ label: string; total: number }>;
  paymentMethods: Array<{ label: string; total: number }>;
  biggestExpense: { description: string; amount: number; date: string } | null;
  recommendations: string[];
  automovel: {
    scopeLabel: string;
    totalCost: number;
    fuelCost: number;
    maintenanceCost: number;
    fixedCostTotal: number;
    monthlyReserveTarget: number;
    coverageWarnings: string[];
    upcomingItems: VehicleFixedCostAgendaItem[];
  };
}

function buildPrintableReportHeadline(
  style: PrintableReportStyle,
  params: {
    net: number;
    totalExpense: number;
    topCategory?: { label: string; total: number; share: number };
    automovelTotal: number;
  },
) {
  if (style === "economy") {
    if (params.net < 0) {
      return "O período fechou pressionado. O maior ganho tende a vir do corte na categoria líder.";
    }

    if (params.topCategory) {
      return `${params.topCategory.label} é o maior foco de economia deste fechamento.`;
    }

    return "Fechamento enxuto. O próximo ganho vem de cortar gastos recorrentes menos visíveis.";
  }

  if (style === "operational") {
    if (params.automovelTotal > 0 && params.automovelTotal >= params.totalExpense * 0.2) {
      return "A operação do automóvel puxou uma fatia relevante do período e merece gestão ativa.";
    }

    return "Este fechamento prioriza leitura operacional para agir rápido no próximo ciclo.";
  }

  if (params.net < 0) {
    return "Fechamento do período com saldo negativo e pontos claros de ajuste.";
  }

  return "Fechamento do período com leitura clara do que mais pesou no caixa.";
}

function sortByDateDesc(a: { date: string }, b: { date: string }) {
  return compareDesc(parseISO(a.date), parseISO(b.date));
}

function sortByDateAsc(a: { date: string }, b: { date: string }) {
  return compareAsc(parseISO(a.date), parseISO(b.date));
}

function getMonthBounds(monthKey: string) {
  const start = startOfMonth(parseISO(`${monthKey}-01`));
  return {
    start,
    end: endOfMonth(start),
  };
}

function isValidParsedDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function normalizeInterval(interval?: number) {
  if (!interval || !Number.isFinite(interval)) {
    return 1;
  }

  return Math.max(1, Math.floor(interval));
}

function createDeltaMetric(current: number, previous: number): DeltaMetric {
  const delta = roundCurrency(current - previous);
  const deltaPercent = previous
    ? roundCurrency((delta / previous) * 100)
    : current
      ? 100
      : 0;

  return {
    current,
    previous,
    delta,
    deltaPercent,
    trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

export function materializeRecurrences(
  rules: RecurrenceRule[],
  startDate: Date,
  endDate: Date,
) {
  const items: MaterializedOccurrence[] = [];

  rules.forEach((rule) => {
    let cursor = parseISO(rule.startDate);
    const interval = normalizeInterval(rule.interval);
    const endLimit = rule.endDate ? parseISO(rule.endDate) : null;

    if (!isValidParsedDate(cursor)) {
      return;
    }

    if (endLimit && !isValidParsedDate(endLimit)) {
      return;
    }

    if (endLimit && isBefore(endLimit, startDate)) {
      return;
    }

    if (isBefore(cursor, startDate)) {
      while (isBefore(cursor, startDate)) {
        cursor =
          rule.frequency === "weekly"
            ? addWeeks(cursor, interval)
            : rule.frequency === "monthly"
              ? addMonths(cursor, interval)
              : addYears(cursor, interval);
      }
    }

    while (
      (isBefore(cursor, endDate) || isEqual(cursor, endDate)) &&
      (!endLimit || !isAfter(cursor, endLimit))
    ) {
      items.push({
        id: `${rule.id}_${format(cursor, "yyyy-MM-dd")}`,
        recurrenceRuleId: rule.id,
        kind: rule.kind,
        date: format(cursor, "yyyy-MM-dd"),
        description: rule.description,
        amount: rule.amount,
        centerId: rule.centerId,
        categoryId: rule.categoryId,
        paymentMethod: rule.paymentMethod,
        wallet: rule.wallet,
        incomeType: rule.incomeType,
      });

      cursor =
        rule.frequency === "weekly"
          ? addWeeks(cursor, interval)
          : rule.frequency === "monthly"
            ? addMonths(cursor, interval)
            : addYears(cursor, interval);
    }
  });

  return items.sort(sortByDateDesc);
}

function hasRealEntryForOccurrence(snapshot: WorkspaceSnapshot, occurrence: MaterializedOccurrence) {
  if (occurrence.kind === "expense") {
    return snapshot.transactions.some(
      (transaction) =>
        transaction.recurrenceRuleId === occurrence.recurrenceRuleId &&
        transaction.transactionDate === occurrence.date,
    );
  }

  return snapshot.incomes.some(
    (income) =>
      income.recurrenceRuleId === occurrence.recurrenceRuleId &&
      income.receivedAt === occurrence.date,
  );
}

function getMaterializedOccurrencesForWindow(
  snapshot: WorkspaceSnapshot,
  startDate: Date,
  endDate: Date,
) {
  return materializeRecurrences(snapshot.recurrences, startDate, endDate).filter(
    (occurrence) => !hasRealEntryForOccurrence(snapshot, occurrence),
  );
}

export function listUnifiedEntries(snapshot: WorkspaceSnapshot, monthKey?: string) {
  const fuelById = new Map(snapshot.fuelLogs.map((item) => [item.id, item] as const));
  const maintenanceById = new Map(snapshot.maintenanceLogs.map((item) => [item.id, item] as const));
  const vehiclesById = new Map(snapshot.vehicles.map((item) => [item.id, item] as const));

  function resolveVehicleContext(originModule: UnifiedEntry["originModule"], originRefId?: string | null) {
    if (originModule !== "moto" || !originRefId) {
      return { vehicleId: null, vehicleName: null };
    }

    const fuelLog = fuelById.get(originRefId);
    if (fuelLog) {
      const vehicle = vehiclesById.get(fuelLog.vehicleId);
      return {
        vehicleId: fuelLog.vehicleId,
        vehicleName: vehicle?.nickname ?? null,
      };
    }

    const maintenanceLog = maintenanceById.get(originRefId);
    if (maintenanceLog) {
      const vehicle = vehiclesById.get(maintenanceLog.vehicleId);
      return {
        vehicleId: maintenanceLog.vehicleId,
        vehicleName: vehicle?.nickname ?? null,
      };
    }

    return { vehicleId: null, vehicleName: null };
  }

  const expenses: UnifiedEntry[] = snapshot.transactions.map((transaction) => ({
    id: transaction.id,
    kind: "expense",
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.transactionDate,
    centerId: transaction.centerId,
    categoryId: transaction.categoryId,
    paymentMethod: transaction.paymentMethod,
    originModule: transaction.originModule,
    originRefId: transaction.originRefId,
    ...resolveVehicleContext(transaction.originModule, transaction.originRefId),
  }));

  const incomes: UnifiedEntry[] = snapshot.incomes.map((income) => ({
    id: income.id,
    kind: "income",
    description: income.description,
    amount: income.amount,
    date: income.receivedAt,
    centerId: income.centerId,
    incomeType: income.incomeType,
    originModule: income.originModule,
    originRefId: income.originRefId,
    ...resolveVehicleContext(income.originModule, income.originRefId),
  }));

  return [...expenses, ...incomes]
    .filter((entry) => (monthKey ? formatMonthKey(entry.date) === monthKey : true))
    .sort(sortByDateDesc);
}

export function getTransactionsForMonth(snapshot: WorkspaceSnapshot, monthKey: string) {
  return snapshot.transactions.filter(
    (transaction) => formatMonthKey(transaction.transactionDate) === monthKey,
  );
}

export function getIncomesForMonth(snapshot: WorkspaceSnapshot, monthKey: string) {
  return snapshot.incomes.filter((income) => formatMonthKey(income.receivedAt) === monthKey);
}

export function getRecurringOccurrencesForMonth(
  snapshot: WorkspaceSnapshot,
  monthKey: string,
) {
  const bounds = getMonthBounds(monthKey);
  return getMaterializedOccurrencesForWindow(snapshot, bounds.start, bounds.end);
}

export function getCardInvoices(snapshot: WorkspaceSnapshot, monthKey: string): CardInvoice[] {
  return snapshot.cards
    .filter((card) => card.active)
    .map((card) => {
      const installments = snapshot.installments.filter(
        (installment) =>
          installment.invoiceMonth === monthKey && installment.cardId === card.id,
      );
      const total = roundCurrency(
        installments.reduce((sum, installment) => sum + installment.amount, 0),
      );

      return {
        cardId: card.id,
        month: monthKey,
        total,
        dueDate:
          installments[0]?.dueDate ??
          `${monthKey}-${String(card.dueDay).padStart(2, "0")}`,
        limit: card.limit,
        utilization: card.limit ? roundCurrency((total / card.limit) * 100) : 0,
        installments,
      };
    })
    .filter((invoice) => invoice.total > 0);
}

export function getFutureInstallmentsByMonth(
  snapshot: WorkspaceSnapshot,
  startMonthKey: string,
  count = 6,
) {
  const months = listMonthKeys(parseISO(`${startMonthKey}-01`), count);

  return months.map((month) => {
    const installments = snapshot.installments.filter(
      (installment) => installment.invoiceMonth === month,
    );

    return {
      month,
      total: roundCurrency(
        installments.reduce((sum, installment) => sum + installment.amount, 0),
      ),
      installments,
    };
  });
}

export function getSpendByCategory(snapshot: WorkspaceSnapshot, monthKey: string) {
  const totals = new Map<string, number>();

  getTransactionsForMonth(snapshot, monthKey).forEach((transaction) => {
    totals.set(
      transaction.categoryId,
      roundCurrency((totals.get(transaction.categoryId) ?? 0) + transaction.amount),
    );
  });

  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({
      category: snapshot.categories.find((category) => category.id === categoryId),
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getSpendByCenter(snapshot: WorkspaceSnapshot, monthKey: string) {
  const totals = new Map<string, number>();

  getTransactionsForMonth(snapshot, monthKey).forEach((transaction) => {
    totals.set(
      transaction.centerId,
      roundCurrency((totals.get(transaction.centerId) ?? 0) + transaction.amount),
    );
  });

  return Array.from(totals.entries()).map(([centerId, total]) => ({
    center: snapshot.costCenters.find((center) => center.id === centerId),
    total,
  }));
}

export function getSpendByPaymentMethod(snapshot: WorkspaceSnapshot, monthKey: string) {
  const totals = new Map<string, number>();

  getTransactionsForMonth(snapshot, monthKey).forEach((transaction) => {
    totals.set(
      transaction.paymentMethod,
      roundCurrency((totals.get(transaction.paymentMethod) ?? 0) + transaction.amount),
    );
  });

  return Array.from(totals.entries()).map(([paymentMethod, total]) => ({
    paymentMethod,
    total,
    label: paymentMethodLabels[paymentMethod as PaymentMethod],
  }));
}

export function getBudgetUsage(snapshot: WorkspaceSnapshot, monthKey: string) {
  const monthlyTransactions = getTransactionsForMonth(snapshot, monthKey);

  return snapshot.budgets
    .filter((budget) => budget.month === monthKey)
    .map((budget) => {
      const spent = roundCurrency(
        monthlyTransactions
          .filter((transaction) => transaction.categoryId === budget.categoryId)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      );
      const category = snapshot.categories.find(
        (item) => item.id === budget.categoryId,
      );
      const percentage = budget.limit ? (spent / budget.limit) * 100 : 0;
      const status: "healthy" | "warning" | "critical" =
        percentage >= 100 ? "critical" : percentage >= 80 ? "warning" : "healthy";

      return {
        budget,
        category,
        spent,
        percentage,
        status,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export function getMonthlyEvolution(snapshot: WorkspaceSnapshot, months = 6) {
  const monthKeys = listMonthKeys(addMonths(startOfMonth(new Date()), -(months - 1)), months);

  return monthKeys.map((month) => {
    const spent = getTransactionsForMonth(snapshot, month).reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    const income = getIncomesForMonth(snapshot, month).reduce(
      (sum, current) => sum + current.amount,
      0,
    );
    const invoice = getCardInvoices(snapshot, month).reduce(
      (sum, current) => sum + current.total,
      0,
    );

    return {
      month,
      spent: roundCurrency(spent),
      income: roundCurrency(income),
      invoice: roundCurrency(invoice),
    };
  });
}

export function getMonthlyComparisons(snapshot: WorkspaceSnapshot, monthKey: string) {
  const previousMonth = formatMonthKey(addMonths(parseISO(`${monthKey}-01`), -1));
  const currentSummary = getDashboardSummary(snapshot, monthKey);
  const previousSummary = getDashboardSummary(snapshot, previousMonth);

  const metrics = [
    {
      id: "income",
      label: "Receita",
      current: currentSummary.consolidated.incomeTotal,
      previous: previousSummary.consolidated.incomeTotal,
    },
    {
      id: "expense",
      label: "Despesa",
      current: currentSummary.consolidated.expenseTotal,
      previous: previousSummary.consolidated.expenseTotal,
    },
    {
      id: "net",
      label: "Saldo líquido",
      current: currentSummary.consolidated.net,
      previous: previousSummary.consolidated.net,
    },
    {
      id: "invoice",
      label: "Fatura",
      current: currentSummary.invoiceTotal,
      previous: previousSummary.invoiceTotal,
    },
  ] as const;

  return metrics.map((metric) => {
    const delta = roundCurrency(metric.current - metric.previous);
    const deltaPercent = metric.previous
      ? roundCurrency((delta / metric.previous) * 100)
      : metric.current
        ? 100
        : 0;

    return {
      ...metric,
      delta,
      deltaPercent,
    };
  });
}

export function getConsolidatedMonthlyTrend(snapshot: WorkspaceSnapshot, months = 6) {
  const monthKeys = listMonthKeys(addMonths(startOfMonth(new Date()), -(months - 1)), months);

  return monthKeys.map((month) => {
    const consolidated = getConsolidatedSummary(snapshot, month);
    const motoCost = roundCurrency(
      calculateFuelTotals(snapshot, month, "all").totalCost +
        calculateMaintenanceTotals(snapshot, month, "all").totalCost,
    );
    const store = getStoreDashboardSummary(snapshot, month);

    return {
      month,
      income: consolidated.incomeTotal,
      expense: consolidated.expenseTotal,
      net: consolidated.net,
      personalExpense: consolidated.personalExpense,
      operationalExpense: consolidated.operationalExpense,
      operationalIncome: consolidated.operationalIncome,
      motoCost,
      storeRevenue: store.revenue,
      storeProfit: store.grossProfit,
    };
  });
}

export function getConsolidatedSummary(snapshot: WorkspaceSnapshot, monthKey: string) {
  const transactions = getTransactionsForMonth(snapshot, monthKey);
  const incomes = getIncomesForMonth(snapshot, monthKey);
  const centerSpend = getSpendByCenter(snapshot, monthKey);
  const expenseTotal = roundCurrency(transactions.reduce((sum, item) => sum + item.amount, 0));
  const incomeTotal = roundCurrency(incomes.reduce((sum, item) => sum + item.amount, 0));
  const operationalExpense = roundCurrency(
    transactions
      .filter((item) =>
        snapshot.costCenters
          .filter((center) => ["moto", "store"].includes(center.kind))
          .some((center) => center.id === item.centerId),
      )
      .reduce((sum, item) => sum + item.amount, 0),
  );
  const operationalIncome = roundCurrency(
    incomes
      .filter((item) =>
        snapshot.costCenters.find((center) => center.id === item.centerId)?.kind === "store",
      )
      .reduce((sum, item) => sum + item.amount, 0),
  );

  return {
    expenseTotal,
    incomeTotal,
    net: roundCurrency(incomeTotal - expenseTotal),
    operationalExpense,
    operationalIncome,
    personalExpense: roundCurrency(expenseTotal - operationalExpense),
    byCenter: centerSpend,
  };
}

export function getDashboardSummary(snapshot: WorkspaceSnapshot, monthKey: string) {
  const transactions = getTransactionsForMonth(snapshot, monthKey);
  const incomes = getIncomesForMonth(snapshot, monthKey);
  const invoices = getCardInvoices(snapshot, monthKey);
  const recurring = getRecurringOccurrencesForMonth(snapshot, monthKey);
  const consolidated = getConsolidatedSummary(snapshot, monthKey);

  const cashIncome = roundCurrency(
    incomes
      .filter((income) => income.wallet === "cash")
      .reduce((sum, income) => sum + income.amount, 0),
  );
  const vrIncome = roundCurrency(
    incomes
      .filter((income) => income.wallet === "vr")
      .reduce((sum, income) => sum + income.amount, 0),
  );
  const cashExpenses = roundCurrency(
    transactions
      .filter((transaction) =>
        ["cash", "pix", "debit"].includes(transaction.paymentMethod),
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const vrExpenses = roundCurrency(
    transactions
      .filter((transaction) => transaction.paymentMethod === "vr")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const creditExpenses = roundCurrency(
    transactions
      .filter((transaction) => transaction.paymentMethod === "credit")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const totalSpent = roundCurrency(
    transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const invoiceTotal = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.total, 0),
  );
  const futureInstallments = roundCurrency(
    snapshot.installments
      .filter((installment) => installment.invoiceMonth > monthKey)
      .reduce((sum, installment) => sum + installment.amount, 0),
  );
  const recurringCashCommitments = roundCurrency(
    recurring
      .filter(
        (item) =>
          item.kind === "expense" &&
          item.paymentMethod &&
          ["cash", "pix", "debit"].includes(item.paymentMethod),
      )
      .reduce((sum, item) => sum + item.amount, 0),
  );
  const cashBalance = roundCurrency(cashIncome - cashExpenses);
  const vrBalance = roundCurrency(vrIncome - vrExpenses);
  const projectedCashBalance = roundCurrency(
    cashBalance - invoiceTotal - recurringCashCommitments,
  );

  return {
    cashIncome,
    vrIncome,
    cashExpenses,
    vrExpenses,
    creditExpenses,
    totalSpent,
    cashBalance,
    vrBalance,
    invoiceTotal,
    futureInstallments,
    projectedCashBalance,
    topCategories: getSpendByCategory(snapshot, monthKey).slice(0, 5),
    spendByCenter: getSpendByCenter(snapshot, monthKey),
    spendByPaymentMethod: getSpendByPaymentMethod(snapshot, monthKey),
    invoices,
    consolidated,
  };
}

export function getProjectionMonths(
  snapshot: WorkspaceSnapshot,
  startMonthKey: string,
  count = 3,
) {
  const months = listMonthKeys(parseISO(`${startMonthKey}-01`), count);

  return months.map((month) => {
    const recurring = getRecurringOccurrencesForMonth(snapshot, month);
    const actualCashIncome = getIncomesForMonth(snapshot, month)
      .filter((income) => income.wallet === "cash")
      .reduce((sum, income) => sum + income.amount, 0);
    const recurringCashIncome = recurring
      .filter((item) => item.kind === "income" && item.wallet === "cash")
      .reduce((sum, item) => sum + item.amount, 0);
    const cashIncome = roundCurrency(actualCashIncome + recurringCashIncome);
    const immediateExpenses = getTransactionsForMonth(snapshot, month)
      .filter((transaction) =>
        ["cash", "pix", "debit"].includes(transaction.paymentMethod),
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const recurringExpenses = recurring
      .filter(
        (item) =>
          item.kind === "expense" &&
          item.paymentMethod &&
          ["cash", "pix", "debit"].includes(item.paymentMethod),
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const invoiceTotal = getCardInvoices(snapshot, month).reduce(
      (sum, invoice) => sum + invoice.total,
      0,
    );
    const committed = roundCurrency(immediateExpenses + recurringExpenses + invoiceTotal);
    const remaining = roundCurrency(cashIncome - committed);
    const committedRatio = cashIncome ? roundCurrency((committed / cashIncome) * 100) : 0;

    return {
      month,
      cashIncome,
      committed,
      invoiceTotal: roundCurrency(invoiceTotal),
      remaining,
      committedRatio,
    };
  });
}

export function getUpcomingDueItems(snapshot: WorkspaceSnapshot, monthKey: string) {
  const currentMonthDate = parseISO(`${monthKey}-01`);
  const nextWindowEnd = endOfMonth(addMonths(currentMonthDate, 1));
  const recurring = getMaterializedOccurrencesForWindow(
    {
      ...snapshot,
      recurrences: snapshot.recurrences.filter((rule) => rule.kind === "expense"),
    },
    currentMonthDate,
    nextWindowEnd,
  );

  const installments = snapshot.installments
    .filter((installment) => {
      const due = parseISO(installment.dueDate);
      return !isBefore(due, currentMonthDate) && !isAfter(due, nextWindowEnd);
    })
    .map((installment) => ({
      id: installment.id,
      date: installment.dueDate,
      amount: installment.amount,
      description: `Parcela ${installment.installmentNumber}/${installment.totalInstallments}`,
    }));

  const reminders = getMaintenanceReminders(snapshot).map((reminder) => ({
    id: reminder.id,
    date: reminder.dueDate ?? format(addDays(new Date(), 30), "yyyy-MM-dd"),
    amount: 0,
    description: reminder.title,
  }));

  const fixedCosts = getVehicleFixedCostAgenda(snapshot, monthKey, "all", 2).map((item) => ({
    id: item.id,
    date: item.dueDate ?? format(addDays(new Date(), 30), "yyyy-MM-dd"),
    amount: item.amount,
    description: item.title,
  }));

  return [...installments, ...recurring, ...reminders, ...fixedCosts]
    .map((item) => ({
      id: item.id,
      date: item.date,
      amount: item.amount,
      description: item.description,
    }))
    .sort(sortByDateAsc)
    .slice(0, 8);
}

export function getRecurrenceInsights(snapshot: WorkspaceSnapshot, monthKey: string): RecurrenceInsights {
  const monthStart = startOfMonth(parseISO(`${monthKey}-01`));
  const windowEnd = addDays(endOfMonth(monthStart), 21);
  const activeRules = snapshot.recurrences.filter((rule) => {
    if (!rule.endDate) {
      return true;
    }

    return !isBefore(parseISO(rule.endDate), monthStart);
  });
  const nextOccurrences = getMaterializedOccurrencesForWindow(snapshot, monthStart, windowEnd)
    .sort(sortByDateAsc)
    .slice(0, 8);
  const endingSoonCount = activeRules.filter((rule) => {
    if (!rule.endDate) {
      return false;
    }

    const endDate = parseISO(rule.endDate);
    return (
      isValidParsedDate(endDate) &&
      !isBefore(endDate, monthStart) &&
      differenceInCalendarDays(endDate, monthStart) <= 21
    );
  }).length;

  return {
    activeRules: activeRules.length,
    incomeRules: activeRules.filter((rule) => rule.kind === "income").length,
    expenseRules: activeRules.filter((rule) => rule.kind === "expense").length,
    endingSoonCount,
    upcomingCount: nextOccurrences.length,
    nextOccurrences,
  };
}

export function getStoreMonthlyTrend(snapshot: WorkspaceSnapshot, months = 6) {
  const monthKeys = listMonthKeys(addMonths(startOfMonth(new Date()), -(months - 1)), months);

  return monthKeys.map((month) => {
    const store = getStoreDashboardSummary(snapshot, month);
    const production = getStoreProductionInsights(snapshot, month);

    return {
      month,
      revenue: store.revenue,
      cost: store.cost,
      profit: store.grossProfit,
      wasteCost: store.wasteCost,
      wasteGrams: store.wasteGrams,
      energyCost: production.totalEnergyCost,
      paintCost: production.totalPaintCost,
    };
  });
}

export function getAutomationFeed(snapshot: WorkspaceSnapshot, monthKey: string, limit = 8) {
  const recurrence = getRecurrenceInsights(snapshot, monthKey).nextOccurrences.map((item) => {
    const dueInDays = differenceInCalendarDays(parseISO(item.date), new Date());

    return {
      id: item.id,
      module: "finance" as const,
      tone: dueInDays <= 3 ? ("warning" as const) : ("info" as const),
      title: item.kind === "income" ? "Entrada recorrente prevista" : "Conta recorrente prevista",
      body: `${item.description} em ${format(parseISO(item.date), "dd/MM")} por ${formatCurrencyBRL(roundCurrency(item.amount))}.`,
      date: item.date,
      dueKm: null,
    };
  });

  const reminders = getMotoUpcomingReminders(snapshot, limit).map((item) => ({
    id: item.id,
    module: "moto" as const,
    tone: item.isOverdue ? ("critical" as const) : ("warning" as const),
    title:
      item.kind === "maintenance"
        ? item.isOverdue
          ? "Manutenção vencida"
          : "Manutenção próxima"
        : item.isOverdue
          ? "Obrigação anual vencida"
          : "Obrigação anual próxima",
    body: item.dueKm
      ? `${item.title} por volta de ${item.dueKm} km.`
      : `${item.title}${item.dueDate ? ` em ${format(parseISO(item.dueDate), "dd/MM")}` : ""}${item.amount ? ` por ${formatCurrencyBRL(item.amount)}` : ""}.`,
    date: item.dueDate ?? null,
    dueKm: item.dueKm ?? null,
  }));

  const stock = getStoreStockSummary(snapshot);
  const stockActions: AutomationItem[] = [
    ...stock.criticalSpools.map((item) => ({
      id: `stock-spool-${item.id}`,
      module: "store" as const,
      tone: "warning" as const,
      title: "Repor filamento",
      body: `${item.name} está com ${item.remainingWeightGrams} g restantes.`,
      date: null,
      dueKm: null,
    })),
    ...stock.criticalSupplies.map((item) => ({
      id: `stock-supply-${item.id}`,
      module: "store" as const,
      tone: "warning" as const,
      title: "Repor insumo",
      body: `${item.name} está em nível crítico (${item.remainingQuantity} ${item.unit}).`,
      date: null,
      dueKm: null,
    })),
  ];

  return [...reminders, ...recurrence, ...stockActions]
    .sort((a, b) => {
      const toneScore = { critical: 0, warning: 1, info: 2 };
      if (toneScore[a.tone] !== toneScore[b.tone]) {
        return toneScore[a.tone] - toneScore[b.tone];
      }

      if (a.date && b.date) {
        return compareAsc(parseISO(a.date), parseISO(b.date));
      }

      if (a.date && !b.date) {
        return -1;
      }

      if (!a.date && b.date) {
        return 1;
      }

      if (a.dueKm && b.dueKm) {
        return a.dueKm - b.dueKm;
      }

      return a.title.localeCompare(b.title, "pt-BR");
    })
    .slice(0, limit);
}

export function getAlerts(snapshot: WorkspaceSnapshot, monthKey: string) {
  const summary = getDashboardSummary(snapshot, monthKey);
  const budgetUsage = getBudgetUsage(snapshot, monthKey);
  const monthProjection = getProjectionMonths(snapshot, monthKey, 3);
  const storeSummary = getStoreDashboardSummary(snapshot, monthKey);
  const recurrenceInsights = getRecurrenceInsights(snapshot, monthKey);
  const motoReminders = getMotoUpcomingReminders(snapshot, 5);
  const motoFixedCosts = getVehicleFixedCostAgenda(snapshot, monthKey, "all", 2);
  const fixedCostCoverageWarnings = getVehicleFixedCostCoverageWarnings(snapshot, "all");
  const alerts: AlertItem[] = [];

  if (summary.projectedCashBalance <= snapshot.settings.salaryMonthly * 0.15) {
    alerts.push({
      id: "low-cash",
      tone: summary.projectedCashBalance < 0 ? "critical" : "warning",
      module: "finance",
      title: "Saldo projetado apertado",
      body: "O caixa do mês está perto do limite depois da fatura e das contas previstas.",
    });
  }

  if (summary.vrBalance <= snapshot.settings.vrMonthly * 0.15) {
    alerts.push({
      id: "low-vr",
      tone: summary.vrBalance < 0 ? "critical" : "warning",
      module: "finance",
      title: "VR acabando",
      body: "Os gastos com alimentação já consumiram quase todo o vale do mês.",
    });
  }

  summary.invoices.forEach((invoice) => {
    if (invoice.utilization >= 50) {
      alerts.push({
        id: `invoice-${invoice.cardId}`,
        tone: invoice.utilization >= 80 ? "critical" : "warning",
        module: "finance",
        title: "Fatura do cartão subindo",
        body: `Este cartão já está em ${Math.round(invoice.utilization)}% de uso no mês.`,
      });
    }
  });

  budgetUsage
    .filter((item) => item.status !== "healthy")
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        id: `budget-${item.budget.id}`,
        tone: item.status === "critical" ? "critical" : "warning",
        module: "finance",
        title: `Orçamento de ${item.category?.name ?? "categoria"} em alerta`,
        body: "O gasto desta categoria já está perto ou acima do limite definido.",
      });
    });

  if (monthProjection.some((month) => month.committedRatio > 35)) {
    alerts.push({
      id: "future-commitment",
      tone: "warning",
      module: "finance",
      title: "Próximos meses comprometidos",
      body: "Uma das próximas projeções está acima de 35% da renda monetária.",
    });
  }

  const overdueReminders = motoReminders.filter((item) => item.isOverdue);
  if (overdueReminders.length) {
    alerts.push({
      id: "moto-overdue",
      tone: "critical",
      module: "moto",
      title: "Veículo com manutenção vencida",
      body: `${overdueReminders.length} cuidado(s) já passaram do ponto por data ou quilometragem.`,
    });
  } else if (motoReminders.length) {
    alerts.push({
      id: "moto-upcoming",
      tone: "warning",
      module: "moto",
      title: "Cuidados do veículo chegando",
      body: "Já existem manutenções próximas; vale se organizar antes de virar urgência.",
    });
  }

  const overdueFixedCosts = motoFixedCosts.filter((item) => item.isOverdue);
  if (overdueFixedCosts.length) {
    alerts.push({
      id: "vehicle-fixed-overdue",
      tone: "critical",
      module: "moto",
      title: "Custos anuais do automóvel vencidos",
      body: `${overdueFixedCosts.length} obrigação(ões) anual(is) já passaram da data prevista.`,
    });
  } else if (motoFixedCosts.length) {
    alerts.push({
      id: "vehicle-fixed-upcoming",
      tone: "warning",
      module: "moto",
      title: "Custos anuais do automóvel no radar",
      body: "IPVA, seguro ou licenciamento já aparecem na agenda dos próximos meses.",
    });
  }

  if (fixedCostCoverageWarnings.length) {
    alerts.push({
      id: "vehicle-fixed-coverage",
      tone: "warning",
      module: "moto",
      title: "Cobertura fixa do automóvel incompleta",
      body: fixedCostCoverageWarnings
        .slice(0, 2)
        .map((item) => item.message)
        .join(" "),
    });
  }

  if (storeSummary.criticalStockCount > 0) {
    alerts.push({
      id: "stock-critical",
      tone: "warning",
      module: "store",
      title: "Estoque crítico na loja",
      body: `${storeSummary.criticalStockCount} item(ns) já estão abaixo do nível seguro.`,
    });
  }

  if (storeSummary.grossProfit < 0) {
    alerts.push({
      id: "store-loss",
      tone: "critical",
      module: "store",
      title: "Loja fechou no prejuízo",
      body: "O período selecionado está com margem negativa entre custo e faturamento entregue.",
    });
  }

  if (storeSummary.cost > 0) {
    const wasteRatio = roundCurrency((storeSummary.wasteCost / storeSummary.cost) * 100);
    if (wasteRatio >= 10) {
      alerts.push({
        id: "store-waste",
        tone: wasteRatio >= 20 ? "critical" : "warning",
        module: "store",
        title: "Desperdício pesando na loja",
        body: `O desperdício já representa ${Math.round(wasteRatio)}% do custo produtivo do período.`,
      });
    }
  }

  if (recurrenceInsights.endingSoonCount > 0) {
    alerts.push({
      id: "recurrence-ending",
      tone: "warning",
      module: "finance",
      title: "Recorrências perto do fim",
      body: `${recurrenceInsights.endingSoonCount} recorrência(s) vão encerrar em breve e podem afetar as próximas projeções.`,
    });
  }

  return alerts
    .sort((a, b) => {
      const toneScore = { critical: 0, warning: 1 };
      return toneScore[a.tone] - toneScore[b.tone];
    })
    .slice(0, 8);
}

export function getExpenseHighlights(snapshot: WorkspaceSnapshot, monthKey: string) {
  const totals = getSpendByCategory(snapshot, monthKey);
  const smoke = totals.find((entry) => entry.category?.slug === "cigarro")?.total ?? 0;
  const drinks = totals.find((entry) => entry.category?.slug === "bebidas")?.total ?? 0;
  const weeds = totals.find((entry) => entry.category?.slug === "ervas")?.total ?? 0;
  const credit = getTransactionsForMonth(snapshot, monthKey)
    .filter((entry) => entry.paymentMethod === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const vr = getTransactionsForMonth(snapshot, monthKey)
    .filter((entry) => entry.paymentMethod === "vr")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    smoke: roundCurrency(smoke),
    drinks: roundCurrency(drinks),
    weeds: roundCurrency(weeds),
    credit: roundCurrency(credit),
    vr: roundCurrency(vr),
  };
}

function getVehicleRecord(snapshot: WorkspaceSnapshot, vehicleId?: VehicleScopeValue | null) {
  if (vehicleId === "all") {
    return null;
  }

  if (!vehicleId) {
    return snapshot.vehicles[0] ?? null;
  }

  return snapshot.vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
}

function getVehicleScope(snapshot: WorkspaceSnapshot, vehicleId?: VehicleScopeValue | null) {
  if (vehicleId === "all") {
    return {
      vehicles: snapshot.vehicles,
      vehicle: null,
      ids: new Set(snapshot.vehicles.map((item) => item.id)),
      isFleet: true,
      label: snapshot.vehicles.length > 1 ? "Todos os veículos" : snapshot.vehicles[0]?.nickname ?? "Todos os veículos",
    };
  }

  const vehicle = getVehicleRecord(snapshot, vehicleId);
  return {
    vehicles: vehicle ? [vehicle] : [],
    vehicle,
    ids: new Set(vehicle ? [vehicle.id] : []),
    isFleet: false,
    label: vehicle?.nickname ?? "Veículo",
  };
}

function buildDueDateForYear(year: number, dueMonth: number, dueDay: number) {
  const monthStart = new Date(year, Math.max(0, dueMonth - 1), 1);
  const safeDay = Math.min(Math.max(1, dueDay), getDate(endOfMonth(monthStart)));
  return format(new Date(year, Math.max(0, dueMonth - 1), safeDay), "yyyy-MM-dd");
}

function isDateWithinRange(date: string, start: Date, end: Date) {
  const parsed = parseISO(date);
  if (!isValidParsedDate(parsed)) {
    return false;
  }

  return isWithinInterval(parsed, { start, end });
}

function getFuelEfficiencyEntries(snapshot: WorkspaceSnapshot, vehicleId?: VehicleScopeValue | null) {
  const scope = getVehicleScope(snapshot, vehicleId);

  return scope.vehicles
    .flatMap((vehicle) => {
      const logs = snapshot.fuelLogs
        .filter((item) => item.vehicleId === vehicle.id)
        .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

      return logs
        .map((log, index) => {
          const previous = logs[index - 1];
          if (!previous) {
            return null;
          }

          const distanceKm = roundCurrency(log.odometerKm - previous.odometerKm);
          if (distanceKm <= 0 || log.liters <= 0) {
            return null;
          }

          return {
            date: log.date,
            vehicleId: vehicle.id,
            vehicleName: vehicle.nickname,
            distanceKm,
            liters: log.liters,
            totalCost: log.totalCost,
            kmPerLiter: roundCurrency(distanceKm / log.liters),
            costPerKm: roundCurrency(log.totalCost / distanceKm),
          };
        })
        .filter(
          (
            item,
          ): item is {
            date: string;
            vehicleId: string;
            vehicleName: string;
            distanceKm: number;
            liters: number;
            totalCost: number;
            kmPerLiter: number;
            costPerKm: number;
          } => Boolean(item),
        );
    })
    .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));
}

function getFixedCostRulesForVehicle(vehicle: WorkspaceSnapshot["vehicles"][number]) {
  return [
    {
      kind: "ipva" as const,
      title: "IPVA",
      rule: vehicle.fixedCosts?.ipva ?? null,
    },
    {
      kind: "insurance" as const,
      title: "Seguro",
      rule: vehicle.fixedCosts?.insurance ?? null,
    },
    {
      kind: "licensing" as const,
      title: "Licenciamento",
      rule: vehicle.fixedCosts?.licensing ?? null,
    },
  ];
}

export function calculateFuelTotals(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: VehicleScopeValue) {
  const scope = getVehicleScope(snapshot, vehicleId);
  const fuelLogs = snapshot.fuelLogs
    .filter((item) => formatMonthKey(item.date) === monthKey)
    .filter((item) => scope.ids.has(item.vehicleId));

  return {
    count: fuelLogs.length,
    totalCost: roundCurrency(fuelLogs.reduce((sum, item) => sum + item.totalCost, 0)),
    totalLiters: roundCurrency(fuelLogs.reduce((sum, item) => sum + item.liters, 0)),
    logs: fuelLogs.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))),
  };
}

export function getMotoFuelInsights(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: VehicleScopeValue) {
  const scope = getVehicleScope(snapshot, vehicleId);
  const fuel = calculateFuelTotals(snapshot, monthKey, vehicleId);
  const efficiencyEntries = getFuelEfficiencyEntries(snapshot, vehicleId).filter(
    (item) => formatMonthKey(item.date) === monthKey,
  );
  const averagePricePerLiter = fuel.totalLiters
    ? roundCurrency(fuel.totalCost / fuel.totalLiters)
    : 0;
  const averageTicket = fuel.count ? roundCurrency(fuel.totalCost / fuel.count) : 0;
  const lastOdometerKm = fuel.logs.length
    ? Math.max(...fuel.logs.map((log) => log.odometerKm))
    : Math.max(...scope.vehicles.map((vehicle) => vehicle.currentOdometerKm), 0);
  const monthlyDistanceKm = roundCurrency(
    efficiencyEntries.reduce((sum, item) => sum + item.distanceKm, 0),
  );
  const actualKmPerLiter = fuel.totalLiters && monthlyDistanceKm
    ? roundCurrency(monthlyDistanceKm / fuel.totalLiters)
    : 0;
  const averageCostPerKm = monthlyDistanceKm
    ? roundCurrency(fuel.totalCost / monthlyDistanceKm)
    : 0;
  const vehiclesWithCityBaseline = scope.vehicles.filter((item) => item.averageCityKmPerLiter);
  const vehiclesWithHighwayBaseline = scope.vehicles.filter((item) => item.averageHighwayKmPerLiter);
  const baselineCityKmPerLiter = vehiclesWithCityBaseline.length
    ? roundCurrency(
        vehiclesWithCityBaseline.reduce((sum, item) => sum + (item.averageCityKmPerLiter ?? 0), 0) /
          vehiclesWithCityBaseline.length,
      )
    : 0;
  const baselineHighwayKmPerLiter = vehiclesWithHighwayBaseline.length
    ? roundCurrency(
        vehiclesWithHighwayBaseline.reduce((sum, item) => sum + (item.averageHighwayKmPerLiter ?? 0), 0) /
          vehiclesWithHighwayBaseline.length,
      )
    : 0;
  const baselineEfficiency = baselineCityKmPerLiter || baselineHighwayKmPerLiter;
  const efficiencyDeltaPercent = actualKmPerLiter && baselineEfficiency
    ? roundCurrency(((actualKmPerLiter - baselineEfficiency) / baselineEfficiency) * 100)
    : 0;
  const projectedFullTankRangeKm = roundCurrency(
    scope.vehicles.reduce((sum, item) => {
      const vehicleBaseline =
        item.averageCityKmPerLiter ?? item.averageHighwayKmPerLiter ?? actualKmPerLiter;
      return sum + (item.tankCapacityLiters ?? 0) * vehicleBaseline;
    }, 0),
  );
  const projectedFuelBudget = roundCurrency(
    scope.vehicles.reduce((sum, item) => {
      const vehicleBaseline = item.averageCityKmPerLiter ?? item.averageHighwayKmPerLiter ?? 0;
      if (!item.monthlyDistanceGoalKm || !vehicleBaseline || !averagePricePerLiter) {
        return sum;
      }
      return sum + (item.monthlyDistanceGoalKm / vehicleBaseline) * averagePricePerLiter;
    }, 0),
  );

  return {
    ...fuel,
    vehicle: scope.vehicle,
    vehicles: scope.vehicles,
    isFleet: scope.isFleet,
    scopeLabel: scope.label,
    averagePricePerLiter,
    averageTicket,
    lastOdometerKm,
    monthlyDistanceKm,
    actualKmPerLiter,
    averageCostPerKm,
    baselineCityKmPerLiter,
    baselineHighwayKmPerLiter,
    efficiencyDeltaPercent,
    projectedFullTankRangeKm,
    projectedFuelBudget,
    efficiencyEntries,
  };
}

export function calculateMaintenanceTotals(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: VehicleScopeValue) {
  const scope = getVehicleScope(snapshot, vehicleId);
  const logs = snapshot.maintenanceLogs
    .filter((item) => formatMonthKey(item.date) === monthKey)
    .filter((item) => scope.ids.has(item.vehicleId));

  return {
    count: logs.length,
    totalCost: roundCurrency(logs.reduce((sum, item) => sum + item.totalCost, 0)),
    byCategory: logs.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = roundCurrency((acc[item.category] ?? 0) + item.totalCost);
      return acc;
    }, {}),
    logs: logs.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))),
  };
}

export function getVehicleFixedCostAgenda(
  snapshot: WorkspaceSnapshot,
  monthKey: string,
  vehicleId?: VehicleScopeValue,
  monthsAhead = 12,
): VehicleFixedCostAgendaItem[] {
  const scope = getVehicleScope(snapshot, vehicleId);
  const start = startOfMonth(parseISO(`${monthKey}-01`));
  const today = new Date();
  const end = endOfMonth(addMonths(start, Math.max(0, monthsAhead - 1)));
  const currentYear = getYear(start);
  const currentYearStart = startOfYear(start);
  const currentYearEnd = endOfYear(start);

  return scope.vehicles
    .flatMap((vehicle) =>
      getFixedCostRulesForVehicle(vehicle).flatMap(({ kind, title, rule }) => {
        if (!rule?.enabled || rule.amount <= 0) {
          return [];
        }

        const candidates: VehicleFixedCostAgendaItem[] = [];

        for (const year of [currentYear, currentYear + 1, currentYear + 2]) {
          const dueDate = buildDueDateForYear(year, rule.dueMonth, rule.dueDay);
          const due = parseISO(dueDate);
          const isCurrentYearOverdue =
            year === currentYear &&
            isWithinInterval(due, { start: currentYearStart, end: currentYearEnd }) &&
            isBefore(due, today);
          const shouldInclude =
            isDateWithinRange(dueDate, start, end) ||
            (isCurrentYearOverdue && isBefore(due, start));

          if (!shouldInclude) {
            continue;
          }

          candidates.push({
            id: `vehicle-fixed-${vehicle.id}-${kind}-${year}`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.nickname,
            kind,
            title: `${title} • ${vehicle.nickname}`,
            amount: roundCurrency(rule.amount),
            dueDate,
            dueKm: null,
            isOverdue: isBefore(due, today),
          });
        }

        return candidates.slice(0, 1);
      }),
    )
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }

      if (a.dueDate && b.dueDate) {
        return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
      }

      return a.title.localeCompare(b.title, "pt-BR");
    });
}

export function getVehicleAnnualFixedCostSummary(
  snapshot: WorkspaceSnapshot,
  referenceYear: number,
  vehicleId?: VehicleScopeValue,
) {
  const scope = getVehicleScope(snapshot, vehicleId);
  const items = scope.vehicles.flatMap((vehicle) =>
    getFixedCostRulesForVehicle(vehicle)
      .filter(({ rule }) => Boolean(rule?.enabled && rule.amount > 0))
      .map(({ kind, title, rule }) => ({
        id: `vehicle-fixed-annual-${vehicle.id}-${kind}-${referenceYear}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.nickname,
        kind,
        title: `${title} • ${vehicle.nickname}`,
        amount: roundCurrency(rule?.amount ?? 0),
        dueDate: buildDueDateForYear(referenceYear, rule?.dueMonth ?? 1, rule?.dueDay ?? 1),
      })),
  );

  return {
    year: referenceYear,
    total: roundCurrency(items.reduce((sum, item) => sum + item.amount, 0)),
    items: items.sort((a, b) => compareAsc(parseISO(a.dueDate), parseISO(b.dueDate))),
  };
}

export function getVehicleFixedCostCoverageWarnings(
  snapshot: WorkspaceSnapshot,
  vehicleId?: VehicleScopeValue,
) {
  const scope = getVehicleScope(snapshot, vehicleId);

  return scope.vehicles.flatMap((vehicle) => {
    const missing = getFixedCostRulesForVehicle(vehicle)
      .filter(({ rule }) => !(rule?.enabled && rule.amount > 0))
      .map(({ title }) => title);

    if (!missing.length) {
      return [];
    }

    return [
      {
        vehicleId: vehicle.id,
        vehicleName: vehicle.nickname,
        missing,
        message: `${vehicle.nickname} sem ${missing.join(", ")} configurado(s).`,
      },
    ];
  });
}

export function getMotoMaintenanceInsights(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: VehicleScopeValue) {
  const maintenance = calculateMaintenanceTotals(snapshot, monthKey, vehicleId);
  const reminders = getMaintenanceReminders(snapshot, vehicleId);
  const reminderByLogId = new Map(reminders.map((reminder) => [reminder.maintenanceLogId, reminder]));
  const enrichedLogs = maintenance.logs.map((log) => ({
    ...log,
    reminder: reminderByLogId.get(log.id) ?? null,
  }));
  const overdueCount = reminders.filter((reminder) => reminder.isOverdue).length;
  const upcomingCount = reminders.filter((reminder) => !reminder.isOverdue).length;
  const topCategoryEntry = Object.entries(maintenance.byCategory).sort((a, b) => b[1] - a[1])[0];

  return {
    ...maintenance,
    logs: enrichedLogs,
    overdueCount,
    upcomingCount,
    topCategory: topCategoryEntry
      ? {
          slug: topCategoryEntry[0],
          label: maintenanceCategoryLabels[topCategoryEntry[0] as keyof typeof maintenanceCategoryLabels] ?? topCategoryEntry[0],
          total: topCategoryEntry[1],
        }
      : null,
  };
}

export function getMaintenanceReminders(snapshot: WorkspaceSnapshot, vehicleId?: VehicleScopeValue): MaintenanceReminder[] {
  const scope = getVehicleScope(snapshot, vehicleId);
  return snapshot.maintenanceLogs
    .filter((item) => scope.ids.has(item.vehicleId))
    .filter((item) => item.recurringKm || item.recurringMonths)
    .map((item) => {
      const dueDate = item.recurringMonths
        ? format(addMonths(parseISO(item.date), item.recurringMonths), "yyyy-MM-dd")
        : null;
      const dueKm = item.recurringKm ? item.odometerKm + item.recurringKm : null;
      const vehicle = snapshot.vehicles.find((entry) => entry.id === item.vehicleId);
      const isOverdue =
        (dueDate ? isBefore(parseISO(dueDate), new Date()) : false) ||
        (dueKm ? (vehicle?.currentOdometerKm ?? 0) >= dueKm : false);

      return {
        id: `reminder_${item.id}`,
        maintenanceLogId: item.id,
        title: `${item.description} ${vehicle ? `• ${vehicle.nickname}` : ""}`.trim(),
        dueDate,
        dueKm,
        isOverdue,
      };
    })
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
      }

      if (a.dueKm && b.dueKm) {
        return a.dueKm - b.dueKm;
      }

      return a.title.localeCompare(b.title, "pt-BR");
    });
}

export function getMotoUpcomingReminders(snapshot: WorkspaceSnapshot, limit = 5, vehicleId?: VehicleScopeValue) {
  const maintenanceReminders = getMaintenanceReminders(snapshot, vehicleId).map((item) => ({
    id: item.id,
    vehicleId:
      snapshot.maintenanceLogs.find((log) => `reminder_${log.id}` === item.id)?.vehicleId ?? "",
    vehicleName: item.title.split("•")[1]?.trim() ?? "",
    kind: "maintenance" as const,
    title: item.title,
    amount: 0,
    dueDate: item.dueDate ?? null,
    dueKm: item.dueKm ?? null,
    isOverdue: item.isOverdue,
  }));
  const fixedCosts = getVehicleFixedCostAgenda(snapshot, formatMonthKey(new Date()), vehicleId, 12);

  return [...maintenanceReminders, ...fixedCosts]
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }

      if (a.dueDate && b.dueDate) {
        return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
      }

      if (a.dueKm && b.dueKm) {
        return a.dueKm - b.dueKm;
      }

      return a.title.localeCompare(b.title, "pt-BR");
    })
    .slice(0, limit);
}

export function getMotoMonthlyTrend(snapshot: WorkspaceSnapshot, months = 6, vehicleId?: VehicleScopeValue) {
  const monthKeys = listMonthKeys(addMonths(startOfMonth(new Date()), -(months - 1)), months);

  return monthKeys.map((month) => {
    const fuel = getMotoFuelInsights(snapshot, month, vehicleId);
    const maintenance = calculateMaintenanceTotals(snapshot, month, vehicleId);

    return {
      month,
      fuelCost: fuel.totalCost,
      maintenanceCost: maintenance.totalCost,
      totalCost: roundCurrency(fuel.totalCost + maintenance.totalCost),
      liters: fuel.totalLiters,
      distanceKm: fuel.monthlyDistanceKm,
      kmPerLiter: fuel.actualKmPerLiter,
    };
  });
}

export function getMotoCostByCategory(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: VehicleScopeValue) {
  const fuel = calculateFuelTotals(snapshot, monthKey, vehicleId);
  const maintenance = calculateMaintenanceTotals(snapshot, monthKey, vehicleId);
  const items = [
    fuel.totalCost
      ? {
          key: "fuel",
          label: "Combustível",
          total: fuel.totalCost,
        }
      : null,
    ...Object.entries(maintenance.byCategory).map(([category, total]) => ({
      key: category,
      label: maintenanceCategoryLabels[category as keyof typeof maintenanceCategoryLabels] ?? category,
      total,
    })),
  ].filter((item): item is { key: string; label: string; total: number } => Boolean(item));

  return items.sort((a, b) => b.total - a.total);
}

export function getVehiclePerformanceTable(snapshot: WorkspaceSnapshot, monthKey: string) {
  return snapshot.vehicles
    .map((vehicle) => {
      const summary = getMotoDashboardSummary(snapshot, monthKey, vehicle.id);
      const fixed = getVehicleAnnualFixedCostSummary(snapshot, getYear(parseISO(`${monthKey}-01`)), vehicle.id);

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.nickname,
        vehicleType: vehicle.vehicleType ?? "motorcycle",
        monthlyCost: summary.monthlyCost,
        fuelCost: summary.fuelCost,
        maintenanceCost: summary.maintenanceCost,
        annualFixedCost: fixed.total,
        liters: summary.fuelLiters,
        distanceKm: summary.monthlyDistanceKm,
        kmPerLiter: summary.actualKmPerLiter,
        costPerKm: summary.averageCostPerKm,
        reminders: summary.reminders.length,
      } satisfies VehiclePerformanceEntry;
    })
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
}

export function getMotoDashboardSummary(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: VehicleScopeValue) {
  const fuel = getMotoFuelInsights(snapshot, monthKey, vehicleId);
  const maintenance = getMotoMaintenanceInsights(snapshot, monthKey, vehicleId);
  const reminders = getMotoUpcomingReminders(snapshot, 8, vehicleId);
  const annualFixedCosts = getVehicleAnnualFixedCostSummary(snapshot, getYear(parseISO(`${monthKey}-01`)), vehicleId);
  const nextFixedCosts = getVehicleFixedCostAgenda(snapshot, monthKey, vehicleId, 12).slice(0, 5);
  const fixedCostCoverageWarnings = getVehicleFixedCostCoverageWarnings(snapshot, vehicleId);

  return {
    vehicle: fuel.vehicle,
    vehicles: fuel.vehicles,
    isFleet: fuel.isFleet,
    scopeLabel: fuel.scopeLabel,
    fuelCost: fuel.totalCost,
    fuelLiters: fuel.totalLiters,
    averagePricePerLiter: fuel.averagePricePerLiter,
    averageTicket: fuel.averageTicket,
    lastOdometerKm: fuel.lastOdometerKm,
    monthlyDistanceKm: fuel.monthlyDistanceKm,
    actualKmPerLiter: fuel.actualKmPerLiter,
    averageCostPerKm: fuel.averageCostPerKm,
    baselineCityKmPerLiter: fuel.baselineCityKmPerLiter,
    baselineHighwayKmPerLiter: fuel.baselineHighwayKmPerLiter,
    efficiencyDeltaPercent: fuel.efficiencyDeltaPercent,
    projectedFullTankRangeKm: fuel.projectedFullTankRangeKm,
    projectedFuelBudget: fuel.projectedFuelBudget,
    maintenanceCost: maintenance.totalCost,
    annualFixedCost: annualFixedCosts.total,
    monthlyReserveTarget: roundCurrency(annualFixedCosts.total / 12),
    annualFixedCostItems: annualFixedCosts.items,
    fixedCostCoverageWarnings,
    nextFixedCosts,
    monthlyCost: roundCurrency(fuel.totalCost + maintenance.totalCost),
    recentFuelLogs: fuel.logs.slice(0, 5),
    recentMaintenance: maintenance.logs.slice(0, 5),
    reminders: reminders.slice(0, 8),
  };
}

export function getReportPeriodRange(anchorDate: string, period: ReportPeriod) {
  const anchor = parseISO(anchorDate);
  const safeAnchor = isValidParsedDate(anchor) ? anchor : new Date();

  if (period === "day") {
    return {
      start: safeAnchor,
      end: safeAnchor,
      label: format(safeAnchor, "dd/MM/yyyy"),
    };
  }

  if (period === "week") {
    const start = startOfWeek(safeAnchor, { weekStartsOn: 1 });
    const end = endOfWeek(safeAnchor, { weekStartsOn: 1 });
    return {
      start,
      end,
      label: `${format(start, "dd/MM")} a ${format(end, "dd/MM/yyyy")}`,
    };
  }

  if (period === "year") {
    const start = startOfYear(safeAnchor);
    const end = endOfYear(safeAnchor);
    return {
      start,
      end,
      label: format(start, "yyyy"),
    };
  }

  const start = startOfMonth(safeAnchor);
  const end = endOfMonth(safeAnchor);
  return {
    start,
    end,
    label: format(start, "MM/yyyy"),
  };
}

function getTransactionsInRange(snapshot: WorkspaceSnapshot, start: Date, end: Date) {
  return snapshot.transactions
    .filter((item) => isDateWithinRange(item.transactionDate, start, end))
    .sort((a, b) => compareDesc(parseISO(a.transactionDate), parseISO(b.transactionDate)));
}

function getIncomesInRange(snapshot: WorkspaceSnapshot, start: Date, end: Date) {
  return snapshot.incomes
    .filter((item) => isDateWithinRange(item.receivedAt, start, end))
    .sort((a, b) => compareDesc(parseISO(a.receivedAt), parseISO(b.receivedAt)));
}

function getVehicleCostsInRange(snapshot: WorkspaceSnapshot, start: Date, end: Date, vehicleId?: VehicleScopeValue) {
  const scope = getVehicleScope(snapshot, vehicleId);
  const annualFixedCosts = getVehicleAnnualFixedCostSummary(snapshot, getYear(start), vehicleId);
  const fixedCostCoverageWarnings = getVehicleFixedCostCoverageWarnings(snapshot, vehicleId);
  const fuelCost = roundCurrency(
    snapshot.fuelLogs
      .filter((item) => scope.ids.has(item.vehicleId))
      .filter((item) => isDateWithinRange(item.date, start, end))
      .reduce((sum, item) => sum + item.totalCost, 0),
  );
  const maintenanceCost = roundCurrency(
    snapshot.maintenanceLogs
      .filter((item) => scope.ids.has(item.vehicleId))
      .filter((item) => isDateWithinRange(item.date, start, end))
      .reduce((sum, item) => sum + item.totalCost, 0),
  );
  const fixedCostItems = getVehicleFixedCostAgenda(snapshot, formatMonthKey(start), vehicleId, 12).filter(
    (item) => item.dueDate && isDateWithinRange(item.dueDate, start, end),
  );

  return {
    scopeLabel: scope.label,
    fuelCost,
    maintenanceCost,
    fixedCostTotal: roundCurrency(fixedCostItems.reduce((sum, item) => sum + item.amount, 0)),
    monthlyReserveTarget: roundCurrency(annualFixedCosts.total / 12),
    coverageWarnings: fixedCostCoverageWarnings.map((item) => item.message),
    totalCost: roundCurrency(fuelCost + maintenanceCost + fixedCostItems.reduce((sum, item) => sum + item.amount, 0)),
    upcomingItems: fixedCostItems.slice(0, 6),
  };
}

export function getPrintableSpendingReport(
  snapshot: WorkspaceSnapshot,
  params: {
    anchorDate: string;
    period: ReportPeriod;
    vehicleId?: VehicleScopeValue;
    style?: PrintableReportStyle;
  },
): PrintableSpendingReport {
  const style = params.style ?? "neutral";
  const range = getReportPeriodRange(params.anchorDate, params.period);
  const transactions = getTransactionsInRange(snapshot, range.start, range.end);
  const incomes = getIncomesInRange(snapshot, range.start, range.end);
  const totalExpense = roundCurrency(transactions.reduce((sum, item) => sum + item.amount, 0));
  const totalIncome = roundCurrency(incomes.reduce((sum, item) => sum + item.amount, 0));
  const net = roundCurrency(totalIncome - totalExpense);
  const categoryTotals = new Map<string, number>();
  const centerTotals = new Map<string, number>();
  const paymentMethodTotals = new Map<string, number>();

  transactions.forEach((transaction) => {
    categoryTotals.set(
      transaction.categoryId,
      roundCurrency((categoryTotals.get(transaction.categoryId) ?? 0) + transaction.amount),
    );
    centerTotals.set(
      transaction.centerId,
      roundCurrency((centerTotals.get(transaction.centerId) ?? 0) + transaction.amount),
    );
    paymentMethodTotals.set(
      transaction.paymentMethod,
      roundCurrency((paymentMethodTotals.get(transaction.paymentMethod) ?? 0) + transaction.amount),
    );
  });

  const topCategories = Array.from(categoryTotals.entries())
    .map(([categoryId, total]) => {
      const category = snapshot.categories.find((item) => item.id === categoryId);
      return {
        label: category?.name ?? "Categoria",
        total,
        share: totalExpense ? roundCurrency((total / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const topCenters = Array.from(centerTotals.entries())
    .map(([centerId, total]) => ({
      label: snapshot.costCenters.find((item) => item.id === centerId)?.name ?? "Centro",
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const paymentMethods = Array.from(paymentMethodTotals.entries())
    .map(([paymentMethod, total]) => ({
      label: paymentMethodLabels[paymentMethod as PaymentMethod],
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const biggestExpenseSource = [...transactions].sort((a, b) => b.amount - a.amount)[0];
  const biggestExpense = biggestExpenseSource
    ? {
        description: biggestExpenseSource.description,
        amount: biggestExpenseSource.amount,
        date: biggestExpenseSource.transactionDate,
      }
    : null;

  const automovel = getVehicleCostsInRange(snapshot, range.start, range.end, params.vehicleId);
  const recommendations: string[] = [];
  const topCategory = topCategories[0];
  const topPaymentMethod = paymentMethods[0];
  const headline = buildPrintableReportHeadline(style, {
    net,
    totalExpense,
    topCategory,
    automovelTotal: automovel.totalCost,
  });

  if (style === "economy") {
    recommendations.push(
      topCategory
        ? `Se precisar cortar agora, comece por ${topCategory.label}. Ela concentra ${Math.round(topCategory.share)}% das despesas do período.`
        : "Se precisar cortar agora, priorize saídas recorrentes e operacionais antes de gastos pontuais menores.",
    );
  }

  if (style === "operational") {
    recommendations.push(
      `Separe revisão, combustível e custos fixos anuais com uma reserva mensal de ${formatCurrencyBRL(automovel.monthlyReserveTarget)} para não transformar obrigação previsível em urgência.`,
    );
  }

  if (topCategory && topCategory.share >= 25) {
    recommendations.push(
      `${topCategory.label} lidera o período com ${formatCurrencyBRL(topCategory.total)} e ${Math.round(topCategory.share)}% das despesas. Vale revisar esse grupo primeiro.`,
    );
  }

  if (topPaymentMethod && totalExpense > 0 && topPaymentMethod.total / totalExpense >= 0.35) {
    recommendations.push(
      `${topPaymentMethod.label} concentrou ${formatCurrencyBRL(topPaymentMethod.total)} do período. Se isso não era esperado, vale revisar esse fluxo.`,
    );
  }

  if (automovel.totalCost > 0 && totalExpense > 0 && automovel.totalCost / totalExpense >= 0.2) {
    recommendations.push(
      `Automóvel respondeu por ${formatCurrencyBRL(automovel.totalCost)} no período. Combustível, manutenção e custos fixos merecem atenção.`,
    );
  }

  if (automovel.coverageWarnings.length) {
    recommendations.push(
      `Antes do próximo fechamento, complete a cobertura fixa do automóvel: ${automovel.coverageWarnings
        .map((item) => item.replace(/\.$/, ""))
        .join(" ")}`,
    );
  }

  if (net < 0) {
    recommendations.push("O período fechou negativo. Reduzir a categoria líder e revisar despesas operacionais tende a gerar o maior impacto.");
  } else if (!recommendations.length) {
    recommendations.push("O período está equilibrado. O foco pode ser reduzir desperdícios e manter constância nas categorias com gasto recorrente.");
  }

  return {
    style,
    headline,
    period: params.period,
    periodLabel: range.label,
    anchorDate: params.anchorDate,
    startDate: format(range.start, "yyyy-MM-dd"),
    endDate: format(range.end, "yyyy-MM-dd"),
    totalIncome,
    totalExpense,
    net,
    topCategories,
    topCenters,
    paymentMethods,
    biggestExpense,
    recommendations,
    automovel,
  };
}

export function getStoreStockSummary(snapshot: WorkspaceSnapshot) {
  const criticalSpools = snapshot.filamentSpools.filter(
    (item) => item.remainingWeightGrams <= item.nominalWeightGrams * 0.2,
  );
  const criticalSupplies = snapshot.supplyItems.filter(
    (item) => item.remainingQuantity <= item.totalQuantity * 0.2,
  );

  return {
    filamentCount: snapshot.filamentSpools.length,
    supplyCount: snapshot.supplyItems.length,
    criticalStockCount: criticalSpools.length + criticalSupplies.length,
    filamentValue: roundCurrency(
      snapshot.filamentSpools.reduce(
        (sum, item) => sum + item.remainingWeightGrams * item.costPerGram,
        0,
      ),
    ),
    supplyValue: roundCurrency(
      snapshot.supplyItems.reduce(
        (sum, item) => sum + item.remainingQuantity * item.unitCost,
        0,
      ),
    ),
    criticalSpools,
    criticalSupplies,
  };
}

export function getStoreMovementFeed(
  snapshot: WorkspaceSnapshot,
  filters?: {
    month?: string;
    itemKind?: StockItemKind | "all";
    movementKind?: StockMovementKind | "all";
  },
) {
  return snapshot.stockMovements
    .filter((movement) => (filters?.month ? formatMonthKey(movement.occurredAt) === filters.month : true))
    .filter((movement) => (filters?.itemKind && filters.itemKind !== "all" ? movement.itemKind === filters.itemKind : true))
    .filter((movement) =>
      filters?.movementKind && filters.movementKind !== "all" ? movement.movementKind === filters.movementKind : true,
    )
    .map((movement) => {
      const item =
        movement.itemKind === "filament"
          ? snapshot.filamentSpools.find((entry) => entry.id === movement.itemId)
          : snapshot.supplyItems.find((entry) => entry.id === movement.itemId);
      const productionJob = movement.relatedProductionJobId
        ? snapshot.productionJobs.find((job) => job.id === movement.relatedProductionJobId)
        : null;

      return {
        ...movement,
        itemName: movement.itemName ?? item?.name ?? "Item removido",
        itemCategory:
          movement.itemCategory ??
          (movement.itemKind === "filament"
            ? item && "material" in item
              ? `${item.material} • ${item.color}`
              : null
            : item && "category" in item
              ? item.category
              : null),
        productionJobName: productionJob?.name ?? null,
      };
    })
    .sort((a, b) => {
      const dateDiff = compareDesc(parseISO(a.occurredAt), parseISO(b.occurredAt));
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return compareDesc(parseISO(a.updatedAt), parseISO(b.updatedAt));
    });
}

export function getStoreConsumptionByFilament(snapshot: WorkspaceSnapshot, monthKey?: string) {
  const jobsById = new Map(snapshot.productionJobs.map((job) => [job.id, job]));
  const grouped = new Map<string, { label: string; quantity: number; wasteQuantity: number; totalCost: number }>();

  snapshot.productionMaterialUsages
    .filter((usage) => usage.itemKind === "filament")
    .filter((usage) => {
      if (!monthKey) {
        return true;
      }

      const job = jobsById.get(usage.productionJobId);
      return job ? formatMonthKey(job.date) === monthKey : false;
    })
    .forEach((usage) => {
      const spool = snapshot.filamentSpools.find((item) => item.id === usage.itemId);
      const label = spool ? `${spool.material} • ${spool.color}` : usage.itemName;
      const current = grouped.get(label) ?? { label, quantity: 0, wasteQuantity: 0, totalCost: 0 };

      current.quantity = roundCurrency(current.quantity + usage.quantity);
      current.wasteQuantity = roundCurrency(current.wasteQuantity + usage.wasteQuantity);
      current.totalCost = roundCurrency(current.totalCost + usage.totalCost);
      grouped.set(label, current);
    });

  return Array.from(grouped.values()).sort((a, b) => b.quantity - a.quantity);
}

export function getStoreWasteByItem(snapshot: WorkspaceSnapshot, monthKey?: string) {
  const jobsById = new Map(snapshot.productionJobs.map((job) => [job.id, job]));
  const grouped = new Map<string, { label: string; wasteQuantity: number; wasteCost: number }>();

  snapshot.productionMaterialUsages
    .filter((usage) => usage.wasteQuantity > 0)
    .filter((usage) => {
      if (!monthKey) {
        return true;
      }

      const job = jobsById.get(usage.productionJobId);
      return job ? formatMonthKey(job.date) === monthKey : false;
    })
    .forEach((usage) => {
      const label = usage.itemName;
      const current = grouped.get(label) ?? { label, wasteQuantity: 0, wasteCost: 0 };
      current.wasteQuantity = roundCurrency(current.wasteQuantity + usage.wasteQuantity);
      current.wasteCost = roundCurrency(current.wasteCost + usage.wasteQuantity * usage.unitCost);
      grouped.set(label, current);
    });

  return Array.from(grouped.values()).sort((a, b) => b.wasteCost - a.wasteCost);
}

export function getStoreProductionInsights(snapshot: WorkspaceSnapshot, monthKey: string) {
  const jobs = snapshot.productionJobs.filter((job) => formatMonthKey(job.date) === monthKey);
  const profitJobs = jobs.filter((job) => job.grossProfit > 0);
  const lossJobs = jobs.filter((job) => job.grossProfit < 0);

  return {
    jobs,
    totalEnergyCost: roundCurrency(jobs.reduce((sum, job) => sum + job.energyCost, 0)),
    totalPaintCost: roundCurrency(jobs.reduce((sum, job) => sum + (job.paintCost ?? 0), 0)),
    totalOtherSupplyCost: roundCurrency(jobs.reduce((sum, job) => sum + (job.otherSupplyCost ?? job.supplyCost), 0)),
    totalFinishingCost: roundCurrency(jobs.reduce((sum, job) => sum + job.finishingCost, 0)),
    totalPackagingCost: roundCurrency(jobs.reduce((sum, job) => sum + job.packagingCost, 0)),
    totalAdditionalManualCost: roundCurrency(jobs.reduce((sum, job) => sum + job.additionalManualCost, 0)),
    totalFixedCost: roundCurrency(
      jobs.reduce((sum, job) => sum + (job.fixedCostApplied ?? snapshot.operationalSettings.extraFixedCostPerProduction), 0),
    ),
    averageUnitCost: jobs.length
      ? roundCurrency(jobs.reduce((sum, job) => sum + job.unitCost, 0) / jobs.length)
      : 0,
    profitableCount: profitJobs.length,
    lossCount: lossJobs.length,
  };
}

export function getStoreDashboardSummary(snapshot: WorkspaceSnapshot, monthKey: string) {
  const jobs = snapshot.productionJobs.filter((job) => formatMonthKey(job.date) === monthKey);
  const orders = snapshot.storeOrders.filter((order) => formatMonthKey(order.date) === monthKey);
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const jobIds = new Set(jobs.map((job) => job.id));
  const wasteGrams = roundCurrency(
    snapshot.productionMaterialUsages
      .filter((item) => jobIds.has(item.productionJobId))
      .reduce((sum, item) => sum + item.wasteQuantity, 0),
  );
  const wasteCost = roundCurrency(
    jobs.reduce((sum, item) => sum + item.wasteCost, 0),
  );
  const totalRevenue = roundCurrency(
    deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0),
  );
  const totalCost = roundCurrency(jobs.reduce((sum, job) => sum + job.totalCost, 0));
  const grossProfit = roundCurrency(
    deliveredOrders.reduce((sum, order) => sum + order.grossProfit, 0),
  );
  const averageMargin = totalRevenue ? roundCurrency((grossProfit / totalRevenue) * 100) : 0;
  const stock = getStoreStockSummary(snapshot);
  const costBreakdown = getStoreProductionInsights(snapshot, monthKey);
  const profitByProduct = getProfitByProduct(snapshot, monthKey);

  return {
    revenue: totalRevenue,
    cost: totalCost,
    grossProfit,
    averageMargin,
    wasteGrams,
    wasteCost,
    openOrders: orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled")
      .length,
    criticalStockCount: stock.criticalStockCount,
    recentJobs: jobs.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))).slice(0, 5),
    recentOrders: orders.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))).slice(0, 5),
    profitableProducts: profitByProduct.filter((item) => item.grossProfit >= 0).slice(0, 5),
    lossProducts: profitByProduct.filter((item) => item.grossProfit < 0).slice(0, 5),
    costBreakdown,
    stock,
  };
}

export function getStoreOperationalHighlights(snapshot: WorkspaceSnapshot, monthKey: string) {
  const summary = getStoreDashboardSummary(snapshot, monthKey);
  const topWasteItems = getStoreWasteByItem(snapshot, monthKey).slice(0, 5);
  const topFilaments = getStoreConsumptionByFilament(snapshot, monthKey).slice(0, 5);

  return {
    summary,
    topWasteItems,
    topFilaments,
  };
}

export function getMotoMonthlyComparison(snapshot: WorkspaceSnapshot, monthKey: string, vehicleId?: string) {
  const previousMonth = formatMonthKey(addMonths(parseISO(`${monthKey}-01`), -1));
  const current = getMotoDashboardSummary(snapshot, monthKey, vehicleId);
  const previous = getMotoDashboardSummary(snapshot, previousMonth, vehicleId);

  return {
    monthlyCost: createDeltaMetric(current.monthlyCost, previous.monthlyCost),
    fuelCost: createDeltaMetric(current.fuelCost, previous.fuelCost),
    liters: createDeltaMetric(current.fuelLiters, previous.fuelLiters),
    distanceKm: createDeltaMetric(current.monthlyDistanceKm, previous.monthlyDistanceKm),
    kmPerLiter: createDeltaMetric(current.actualKmPerLiter, previous.actualKmPerLiter),
    maintenanceCost: createDeltaMetric(current.maintenanceCost, previous.maintenanceCost),
    reminders: createDeltaMetric(current.reminders.length, previous.reminders.length),
  };
}

export function getStoreMonthlyComparison(snapshot: WorkspaceSnapshot, monthKey: string) {
  const previousMonth = formatMonthKey(addMonths(parseISO(`${monthKey}-01`), -1));
  const current = getStoreDashboardSummary(snapshot, monthKey);
  const previous = getStoreDashboardSummary(snapshot, previousMonth);

  return {
    revenue: createDeltaMetric(current.revenue, previous.revenue),
    cost: createDeltaMetric(current.cost, previous.cost),
    grossProfit: createDeltaMetric(current.grossProfit, previous.grossProfit),
    averageMargin: createDeltaMetric(current.averageMargin, previous.averageMargin),
    wasteCost: createDeltaMetric(current.wasteCost, previous.wasteCost),
    openOrders: createDeltaMetric(current.openOrders, previous.openOrders),
  };
}

export function getHubExecutiveSummary(
  snapshot: WorkspaceSnapshot,
  monthKey: string,
  vehicleId?: VehicleScopeValue,
) {
  const finance = getDashboardSummary(snapshot, monthKey);
  const moto = getMotoDashboardSummary(snapshot, monthKey, vehicleId ?? "all");
  const store = getStoreDashboardSummary(snapshot, monthKey);
  const previousMonth = formatMonthKey(addMonths(parseISO(`${monthKey}-01`), -1));
  const previousFinance = getDashboardSummary(snapshot, previousMonth);
  const previousMoto = getMotoDashboardSummary(snapshot, previousMonth, vehicleId ?? "all");
  const previousStore = getStoreDashboardSummary(snapshot, previousMonth);
  const alerts = getAlerts(snapshot, monthKey);
  const upcoming = getUpcomingDueItems(snapshot, monthKey);

  return {
    finance,
    moto,
    store,
    alerts,
    upcoming,
    pulse: {
      alertCount: alerts.length,
      criticalAlerts: alerts.filter((item) => item.tone === "critical").length,
      upcomingDueCount: upcoming.length,
      remindersCount: moto.reminders.length,
      openOrders: store.openOrders,
      criticalStockCount: store.criticalStockCount,
    },
    comparisons: {
      financeProjectedBalance: createDeltaMetric(
        finance.projectedCashBalance,
        previousFinance.projectedCashBalance,
      ),
      financeInvoice: createDeltaMetric(finance.invoiceTotal, previousFinance.invoiceTotal),
      motoCost: createDeltaMetric(moto.monthlyCost, previousMoto.monthlyCost),
      motoLiters: createDeltaMetric(moto.fuelLiters, previousMoto.fuelLiters),
      storeRevenue: createDeltaMetric(store.revenue, previousStore.revenue),
      storeProfit: createDeltaMetric(store.grossProfit, previousStore.grossProfit),
    },
  };
}

export function getProfitByProduct(snapshot: WorkspaceSnapshot, monthKey?: string) {
  const orders = snapshot.storeOrders.filter((order) =>
    monthKey ? formatMonthKey(order.date) === monthKey : true,
  );

  const grouped = orders.reduce<
    Record<string, { productName: string; grossProfit: number; totalPrice: number }>
  >((acc, order) => {
    const current = acc[order.productName] ?? {
      productName: order.productName,
      grossProfit: 0,
      totalPrice: 0,
    };

    current.grossProfit = roundCurrency(current.grossProfit + order.grossProfit);
    current.totalPrice = roundCurrency(current.totalPrice + order.totalPrice);
    acc[order.productName] = current;
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      marginPercent: item.totalPrice
        ? roundCurrency((item.grossProfit / item.totalPrice) * 100)
        : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit);
}
