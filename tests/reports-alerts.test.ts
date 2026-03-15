import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAlerts,
  getAutomationFeed,
  getProfitByProduct,
  getProjectionMonths,
  getRecurringOccurrencesForMonth,
  getStoreDashboardSummary,
} from "@/utils/finance";
import { createSeedSnapshot } from "@/utils/seed";

describe("reports, alerts and recurrence helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nao duplica ocorrencia recorrente quando a entrada real ja existe", () => {
    const snapshot = createSeedSnapshot("local");
    const expenseCenterId = snapshot.costCenters.find((item) => item.kind === "me")?.id ?? snapshot.costCenters[0]!.id;
    const categoryId = snapshot.categories[0]!.id;

    snapshot.transactions = [
      {
        ...snapshot.transactions[0]!,
        id: "tx_rec_real",
        centerId: expenseCenterId,
        categoryId,
        description: "Academia",
        amount: 89.9,
        paymentMethod: "pix",
        transactionDate: "2026-03-10",
        recurrenceRuleId: "rec_academia",
      },
    ];
    snapshot.recurrences = [
      {
        ...snapshot.recurrences[0]!,
        id: "rec_academia",
        kind: "expense",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-03-10",
        endDate: null,
        description: "Academia",
        amount: 89.9,
        centerId: expenseCenterId,
        categoryId,
        paymentMethod: "pix",
        cardId: null,
        installments: null,
        incomeType: null,
        wallet: null,
      },
    ];

    const occurrences = getRecurringOccurrencesForMonth(snapshot, "2026-03");

    expect(occurrences).toHaveLength(0);
  });

  it("gera alertas de manutencao vencida e prejuizo na loja", () => {
    const snapshot = createSeedSnapshot("local");
    const motoCenterId = snapshot.costCenters.find((item) => item.kind === "moto")?.id ?? snapshot.costCenters[0]!.id;
    const storeCenterId = snapshot.costCenters.find((item) => item.kind === "store")?.id ?? snapshot.costCenters[0]!.id;
    const vehicleId = snapshot.vehicles[0]!.id;

    snapshot.vehicles = [
      {
        ...snapshot.vehicles[0]!,
        id: vehicleId,
        centerId: motoCenterId,
        currentOdometerKm: 6200,
      },
    ];
    snapshot.maintenanceLogs = [
      {
        ...snapshot.maintenanceLogs[0]!,
        id: "maint_overdue",
        centerId: motoCenterId,
        vehicleId,
        date: "2026-01-01",
        odometerKm: 3000,
        description: "Troca de oleo",
        totalCost: 70,
        recurringMonths: 1,
        recurringKm: 1000,
      },
    ];
    snapshot.productionJobs = [
      {
        ...snapshot.productionJobs[0]!,
        id: "job_loss",
        centerId: storeCenterId,
        date: "2026-03-05",
        totalCost: 120,
        wasteCost: 18,
      },
    ];
    snapshot.storeOrders = [
      {
        ...snapshot.storeOrders[0]!,
        id: "order_loss",
        centerId: storeCenterId,
        date: "2026-03-05",
        productName: "Miniatura dragao",
        status: "delivered",
        totalPrice: 100,
        totalCostSnapshot: 120,
        grossProfit: -20,
      },
    ];

    const alerts = getAlerts(snapshot, "2026-03");

    expect(alerts.some((item) => item.id === "moto-overdue")).toBe(true);
    expect(alerts.some((item) => item.id === "store-loss")).toBe(true);
  });

  it("monta a agenda automatica com recorrencia, manutencao e reposicao critica", () => {
    const snapshot = createSeedSnapshot("local");
    const financeCenterId = snapshot.costCenters.find((item) => item.kind === "shared")?.id ?? snapshot.costCenters[0]!.id;
    const motoCenterId = snapshot.costCenters.find((item) => item.kind === "moto")?.id ?? snapshot.costCenters[0]!.id;
    const vehicleId = snapshot.vehicles[0]!.id;

    snapshot.recurrences = [
      {
        ...snapshot.recurrences[0]!,
        id: "rec_aluguel",
        kind: "expense",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-03-20",
        endDate: null,
        description: "Aluguel",
        amount: 900,
        centerId: financeCenterId,
        categoryId: snapshot.categories[0]!.id,
        paymentMethod: "pix",
        cardId: null,
        installments: null,
        incomeType: null,
        wallet: null,
      },
    ];
    snapshot.vehicles = [
      {
        ...snapshot.vehicles[0]!,
        id: vehicleId,
        centerId: motoCenterId,
        currentOdometerKm: 4500,
      },
    ];
    snapshot.maintenanceLogs = [
      {
        ...snapshot.maintenanceLogs[0]!,
        id: "maint_due",
        centerId: motoCenterId,
        vehicleId,
        date: "2026-02-01",
        odometerKm: 3000,
        description: "Filtro de ar",
        totalCost: 30,
        recurringKm: 1000,
        recurringMonths: null,
      },
    ];
    snapshot.filamentSpools = [
      {
        ...snapshot.filamentSpools[0]!,
        id: "spool_critical",
        remainingWeightGrams: 90,
        nominalWeightGrams: 1000,
      },
    ];

    const feed = getAutomationFeed(snapshot, "2026-03", 10);

    expect(feed.some((item) => item.module === "finance" && item.title.includes("recorrente"))).toBe(true);
    expect(feed.some((item) => item.module === "moto")).toBe(true);
    expect(feed.some((item) => item.module === "store")).toBe(true);
  });

  it("agrega lucro por nome do produto em vez de listar pedido por pedido", () => {
    const snapshot = createSeedSnapshot("local");
    const storeCenterId = snapshot.costCenters.find((item) => item.kind === "store")?.id ?? snapshot.costCenters[0]!.id;

    snapshot.storeOrders = [
      {
        ...snapshot.storeOrders[0]!,
        id: "order_1",
        centerId: storeCenterId,
        productName: "Topo de bolo Mario",
        date: "2026-03-01",
        totalPrice: 60,
        grossProfit: 20,
      },
      {
        ...snapshot.storeOrders[0]!,
        id: "order_2",
        centerId: storeCenterId,
        productName: "Topo de bolo Mario",
        date: "2026-03-11",
        totalPrice: 90,
        grossProfit: 35,
      },
      {
        ...snapshot.storeOrders[0]!,
        id: "order_3",
        centerId: storeCenterId,
        productName: "Suporte de controle",
        date: "2026-03-12",
        totalPrice: 80,
        grossProfit: 10,
      },
    ];

    const profitByProduct = getProfitByProduct(snapshot, "2026-03");
    const mario = profitByProduct.find((item) => item.productName === "Topo de bolo Mario");

    expect(profitByProduct).toHaveLength(2);
    expect(mario).toMatchObject({
      productName: "Topo de bolo Mario",
      totalPrice: 150,
      grossProfit: 55,
    });
  });

  it("soma rendas e despesas recorrentes distintas na projecao mensal", () => {
    const snapshot = createSeedSnapshot("local");
    const centerId = snapshot.costCenters.find((item) => item.kind === "me")?.id ?? snapshot.costCenters[0]!.id;

    snapshot.incomes = [
      {
        ...snapshot.incomes[0]!,
        id: "income_salary_real",
        centerId,
        receivedAt: "2026-04-05",
        amount: 2000,
        wallet: "cash",
        recurrenceRuleId: null,
      },
    ];
    snapshot.transactions = [
      {
        ...snapshot.transactions[0]!,
        id: "tx_market_real",
        centerId,
        transactionDate: "2026-04-08",
        amount: 500,
        paymentMethod: "pix",
        recurrenceRuleId: null,
      },
    ];
    snapshot.recurrences = [
      {
        ...snapshot.recurrences[0]!,
        id: "rec_freela",
        kind: "income",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-04-10",
        description: "Freela fixo",
        amount: 500,
        centerId,
        categoryId: null,
        paymentMethod: null,
        cardId: null,
        installments: null,
        incomeType: "freelance",
        wallet: "cash",
      },
      {
        ...snapshot.recurrences[0]!,
        id: "rec_internet",
        kind: "expense",
        frequency: "monthly",
        interval: 1,
        startDate: "2026-04-12",
        description: "Internet",
        amount: 100,
        centerId,
        categoryId: snapshot.categories[0]!.id,
        paymentMethod: "pix",
        cardId: null,
        installments: null,
        incomeType: null,
        wallet: null,
      },
    ];

    const projection = getProjectionMonths(snapshot, "2026-04", 1)[0];

    expect(projection?.cashIncome).toBe(2500);
    expect(projection?.committed).toBeGreaterThanOrEqual(600);
  });

  it("calcula desperdicio da loja apenas com as producoes do mes selecionado", () => {
    const snapshot = createSeedSnapshot("local");
    const storeCenterId = snapshot.costCenters.find((item) => item.kind === "store")?.id ?? snapshot.costCenters[0]!.id;

    snapshot.productionJobs = [
      {
        ...snapshot.productionJobs[0]!,
        id: "job_march",
        centerId: storeCenterId,
        date: "2026-03-10",
        totalCost: 80,
        wasteCost: 5,
      },
      {
        ...snapshot.productionJobs[0]!,
        id: "job_feb",
        centerId: storeCenterId,
        date: "2026-02-10",
        totalCost: 60,
        wasteCost: 3,
      },
    ];
    snapshot.productionMaterialUsages = [
      {
        ...snapshot.productionMaterialUsages[0]!,
        id: "usage_march",
        productionJobId: "job_march",
        wasteQuantity: 12,
      },
      {
        ...snapshot.productionMaterialUsages[0]!,
        id: "usage_feb",
        productionJobId: "job_feb",
        wasteQuantity: 40,
      },
    ];

    const summary = getStoreDashboardSummary(snapshot, "2026-03");

    expect(summary.wasteGrams).toBe(12);
  });
});
