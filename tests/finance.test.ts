import { describe, expect, it } from "vitest";

import { createSeedSnapshot } from "@/utils/seed";
import {
  getBudgetUsage,
  getDashboardSummary,
  getHubExecutiveSummary,
  getMotoDashboardSummary,
  getMotoMonthlyComparison,
  getProjectionMonths,
  getStoreDashboardSummary,
  getStoreMonthlyTrend,
} from "@/utils/finance";

describe("finance selectors", () => {
  it("calcula o resumo principal do dashboard", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const summary = getDashboardSummary(snapshot, month);

    expect(summary.cashIncome).toBeGreaterThan(0);
    expect(summary.vrBalance).toBeLessThan(snapshot.settings.vrMonthly);
    expect(summary.invoiceTotal).toBeGreaterThan(0);
  });

  it("retorna budgets com percentual e status", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const usage = getBudgetUsage(snapshot, month);

    expect(usage.length).toBeGreaterThan(0);
    expect(usage[0]).toHaveProperty("percentage");
    expect(["healthy", "warning", "critical"]).toContain(usage[0].status);
  });

  it("gera projeção dos próximos meses", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const projection = getProjectionMonths(snapshot, month, 3);

    expect(projection).toHaveLength(3);
    expect(projection[0].month).toBe(month);
  });

  it("resume moto e loja com dados seeded", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const moto = getMotoDashboardSummary(snapshot, month);
    const store = getStoreDashboardSummary(snapshot, month);

    expect(moto.monthlyCost).toBeGreaterThan(0);
    expect(store.revenue).toBeGreaterThan(0);
    expect(store.criticalStockCount).toBeGreaterThanOrEqual(0);
  });

  it("monta uma visao executiva do hub com comparativos e pulso", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const hub = getHubExecutiveSummary(snapshot, month);

    expect(hub.finance.invoiceTotal).toBeGreaterThan(0);
    expect(hub.moto.monthlyCost).toBeGreaterThan(0);
    expect(hub.store.revenue).toBeGreaterThan(0);
    expect(hub.pulse.alertCount).toBeGreaterThanOrEqual(0);
    expect(hub.comparisons.storeProfit).toHaveProperty("delta");
  });

  it("gera comparativo mensal da moto e tendencia da loja", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const motoComparison = getMotoMonthlyComparison(snapshot, month);
    const storeTrend = getStoreMonthlyTrend(snapshot, 4);

    expect(motoComparison.monthlyCost).toHaveProperty("deltaPercent");
    expect(storeTrend).toHaveLength(4);
    expect(storeTrend[0]).toHaveProperty("profit");
  });
});
