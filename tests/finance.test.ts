import { describe, expect, it } from "vitest";

import { createSeedSnapshot } from "@/utils/seed";
import {
  getAlerts,
  getBudgetUsage,
  getDashboardSummary,
  getHubExecutiveSummary,
  listUnifiedEntries,
  getPrintableSpendingReport,
  getMotoDashboardSummary,
  getMotoMonthlyComparison,
  getProjectionMonths,
  getStoreDashboardSummary,
  getStoreMonthlyTrend,
  getVehicleAnnualFixedCostSummary,
  getVehicleFixedCostAgenda,
  getVehiclePerformanceTable,
} from "@/utils/finance";

describe("finance selectors", () => {
  it("calcula o resumo principal do dashboard", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const summary = getDashboardSummary(snapshot, month);

    expect(summary.cashIncome).toBeGreaterThan(0);
    expect(summary.vrBalance).toBeLessThan(snapshot.settings.vrMonthly);
    expect(summary.creditExpenses).toBeGreaterThan(0);
    expect(summary.futureInstallments).toBeGreaterThan(0);
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

    expect(hub.finance.creditExpenses).toBeGreaterThan(0);
    expect(hub.finance.futureInstallments).toBeGreaterThan(0);
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

  it("gera visao por veiculo especifico e todos os veiculos", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const firstVehicle = snapshot.vehicles[0];
    const fleet = getMotoDashboardSummary(snapshot, month, "all");
    const single = getMotoDashboardSummary(snapshot, month, firstVehicle.id);
    const performance = getVehiclePerformanceTable(snapshot, month);

    expect(fleet.isFleet).toBe(true);
    expect(fleet.vehicles).toHaveLength(snapshot.vehicles.length);
    expect(single.scopeLabel).toContain(firstVehicle.nickname);
    expect(single.annualFixedCost).toBeGreaterThan(0);
    expect(performance).toHaveLength(snapshot.vehicles.length);
  });

  it("agenda custos fixos anuais do automovel para o ano e proximos vencimentos", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const referenceYear = Number(month.slice(0, 4));
    const firstVehicle = snapshot.vehicles[0];
    const annual = getVehicleAnnualFixedCostSummary(snapshot, referenceYear, "all");
    const agenda = getVehicleFixedCostAgenda(snapshot, month, firstVehicle.id, 12);

    expect(annual.total).toBeGreaterThan(0);
    expect(annual.items.length).toBeGreaterThan(0);
    expect(agenda.length).toBeGreaterThan(0);
    expect(agenda.every((item) => item.vehicleId === firstVehicle.id)).toBe(true);
  });

  it("gera relatorio imprimivel com maior gasto e recomendacoes", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const report = getPrintableSpendingReport(snapshot, {
      anchorDate: `${month}-15`,
      period: "month",
      vehicleId: "all",
      style: "economy",
    });

    expect(report.style).toBe("economy");
    expect(report.headline).toBeTruthy();
    expect(report.period).toBe("month");
    expect(report.totalExpense).toBeGreaterThan(0);
    expect(report.automovel.totalCost).toBeGreaterThan(0);
    expect(report.automovel.monthlyReserveTarget).toBeGreaterThan(0);
    expect(report.biggestExpense).not.toBeNull();
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("propaga contexto de veiculo para o feed e para o hub", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    const firstVehicle = snapshot.vehicles[0];
    const entries = listUnifiedEntries(snapshot, month);
    const vehicleEntry = entries.find((entry) => entry.vehicleId === firstVehicle.id);
    const hub = getHubExecutiveSummary(snapshot, month, firstVehicle.id);

    expect(vehicleEntry?.vehicleName).toBe(firstVehicle.nickname);
    expect(hub.moto.scopeLabel).toContain(firstVehicle.nickname);
  });

  it("avisa quando faltam custos fixos do automovel", () => {
    const snapshot = createSeedSnapshot("local");
    const month = snapshot.budgets[0].month;
    snapshot.vehicles[0].fixedCosts = {
      ...snapshot.vehicles[0].fixedCosts,
      insurance: null,
    };

    const summary = getMotoDashboardSummary(snapshot, month, snapshot.vehicles[0].id);
    const alerts = getAlerts(snapshot, month);
    const report = getPrintableSpendingReport(snapshot, {
      anchorDate: `${month}-15`,
      period: "month",
      vehicleId: snapshot.vehicles[0].id,
      style: "operational",
    });

    expect(summary.fixedCostCoverageWarnings.length).toBeGreaterThan(0);
    expect(alerts.some((item) => item.id === "vehicle-fixed-coverage")).toBe(true);
    expect(report.automovel.coverageWarnings.length).toBeGreaterThan(0);
  });
});
