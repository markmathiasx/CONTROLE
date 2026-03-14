import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  compareAsc,
  compareDesc,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfMonth,
} from "date-fns";

import { paymentMethodLabels } from "@/lib/constants";
import { formatMonthKey, listMonthKeys, roundCurrency } from "@/lib/utils";
import type {
  CardInvoice,
  EntryKind,
  Income,
  MaintenanceReminder,
  PaymentMethod,
  RecurrenceRule,
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
}

export interface MaterializedOccurrence {
  id: string;
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

export function materializeRecurrences(
  rules: RecurrenceRule[],
  startDate: Date,
  endDate: Date,
) {
  const items: MaterializedOccurrence[] = [];

  rules.forEach((rule) => {
    let cursor = parseISO(rule.startDate);

    if (isBefore(cursor, startDate)) {
      while (isBefore(cursor, startDate)) {
        cursor =
          rule.frequency === "weekly"
            ? addWeeks(cursor, rule.interval)
            : rule.frequency === "monthly"
              ? addMonths(cursor, rule.interval)
              : addYears(cursor, rule.interval);
      }
    }

    while (
      (isBefore(cursor, endDate) || isEqual(cursor, endDate)) &&
      (!rule.endDate || !isAfter(cursor, parseISO(rule.endDate)))
    ) {
      items.push({
        id: `${rule.id}_${format(cursor, "yyyy-MM-dd")}`,
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
          ? addWeeks(cursor, rule.interval)
          : rule.frequency === "monthly"
            ? addMonths(cursor, rule.interval)
            : addYears(cursor, rule.interval);
    }
  });

  return items.sort(sortByDateDesc);
}

export function listUnifiedEntries(snapshot: WorkspaceSnapshot, monthKey?: string) {
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
  return materializeRecurrences(snapshot.recurrences, bounds.start, bounds.end);
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
    const cashIncome = roundCurrency(Math.max(actualCashIncome, recurringCashIncome));
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
    const committed = roundCurrency(
      Math.max(immediateExpenses, recurringExpenses) + invoiceTotal,
    );
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
  const recurring = materializeRecurrences(
    snapshot.recurrences.filter((rule) => rule.kind === "expense"),
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

  return [...installments, ...recurring, ...reminders]
    .map((item) => ({
      id: item.id,
      date: item.date,
      amount: item.amount,
      description: item.description,
    }))
    .sort(sortByDateAsc)
    .slice(0, 8);
}

export function getAlerts(snapshot: WorkspaceSnapshot, monthKey: string) {
  const summary = getDashboardSummary(snapshot, monthKey);
  const budgetUsage = getBudgetUsage(snapshot, monthKey);
  const monthProjection = getProjectionMonths(snapshot, monthKey, 3);
  const storeSummary = getStoreDashboardSummary(snapshot, monthKey);
  const alerts: Array<{ id: string; tone: "warning" | "critical"; title: string; body: string }> =
    [];

  if (summary.projectedCashBalance <= snapshot.settings.salaryMonthly * 0.15) {
    alerts.push({
      id: "low-cash",
      tone: summary.projectedCashBalance < 0 ? "critical" : "warning",
      title: "Saldo projetado apertado",
      body: "O caixa do mês está perto do limite depois da fatura e das contas previstas.",
    });
  }

  if (summary.vrBalance <= snapshot.settings.vrMonthly * 0.15) {
    alerts.push({
      id: "low-vr",
      tone: summary.vrBalance < 0 ? "critical" : "warning",
      title: "VR acabando",
      body: "Os gastos com alimentação já consumiram quase todo o vale do mês.",
    });
  }

  summary.invoices.forEach((invoice) => {
    if (invoice.utilization >= 50) {
      alerts.push({
        id: `invoice-${invoice.cardId}`,
        tone: invoice.utilization >= 80 ? "critical" : "warning",
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
        title: `Orçamento de ${item.category?.name ?? "categoria"} em alerta`,
        body: "O gasto desta categoria já está perto ou acima do limite definido.",
      });
    });

  if (monthProjection.some((month) => month.committedRatio > 35)) {
    alerts.push({
      id: "future-commitment",
      tone: "warning",
      title: "Próximos meses comprometidos",
      body: "Uma das próximas projeções está acima de 35% da renda monetária.",
    });
  }

  if (storeSummary.criticalStockCount > 0) {
    alerts.push({
      id: "stock-critical",
      tone: "warning",
      title: "Estoque crítico na loja",
      body: `${storeSummary.criticalStockCount} item(ns) já estão abaixo do nível seguro.`,
    });
  }

  return alerts.slice(0, 6);
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

export function calculateFuelTotals(snapshot: WorkspaceSnapshot, monthKey: string) {
  const fuelLogs = snapshot.fuelLogs.filter((item) => formatMonthKey(item.date) === monthKey);

  return {
    count: fuelLogs.length,
    totalCost: roundCurrency(fuelLogs.reduce((sum, item) => sum + item.totalCost, 0)),
    totalLiters: roundCurrency(fuelLogs.reduce((sum, item) => sum + item.liters, 0)),
    logs: fuelLogs.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))),
  };
}

export function calculateMaintenanceTotals(snapshot: WorkspaceSnapshot, monthKey: string) {
  const logs = snapshot.maintenanceLogs.filter((item) => formatMonthKey(item.date) === monthKey);

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

export function getMaintenanceReminders(snapshot: WorkspaceSnapshot): MaintenanceReminder[] {
  return snapshot.maintenanceLogs
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

      return 0;
    });
}

export function getMotoDashboardSummary(snapshot: WorkspaceSnapshot, monthKey: string) {
  const fuel = calculateFuelTotals(snapshot, monthKey);
  const maintenance = calculateMaintenanceTotals(snapshot, monthKey);
  const reminders = getMaintenanceReminders(snapshot);

  return {
    fuelCost: fuel.totalCost,
    fuelLiters: fuel.totalLiters,
    maintenanceCost: maintenance.totalCost,
    monthlyCost: roundCurrency(fuel.totalCost + maintenance.totalCost),
    recentFuelLogs: fuel.logs.slice(0, 5),
    recentMaintenance: maintenance.logs.slice(0, 5),
    reminders: reminders.slice(0, 5),
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
    criticalSpools,
    criticalSupplies,
  };
}

export function getStoreDashboardSummary(snapshot: WorkspaceSnapshot, monthKey: string) {
  const jobs = snapshot.productionJobs.filter((job) => formatMonthKey(job.date) === monthKey);
  const orders = snapshot.storeOrders.filter((order) => formatMonthKey(order.date) === monthKey);
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const wasteGrams = roundCurrency(
    snapshot.productionMaterialUsages.reduce((sum, item) => sum + item.wasteQuantity, 0),
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
    stock,
  };
}

export function getProfitByProduct(snapshot: WorkspaceSnapshot, monthKey?: string) {
  const orders = snapshot.storeOrders.filter((order) =>
    monthKey ? formatMonthKey(order.date) === monthKey : true,
  );

  return orders
    .map((order) => ({
      productName: order.productName,
      grossProfit: order.grossProfit,
      totalPrice: order.totalPrice,
      marginPercent: order.totalPrice
        ? roundCurrency((order.grossProfit / order.totalPrice) * 100)
        : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit);
}
