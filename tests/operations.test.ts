import { describe, expect, it } from "vitest";

import { calculateProductionMetrics, solveFuelValues, splitGroupedFilamentPurchase } from "@/utils/operations";

describe("operational calculations", () => {
  it("resolve litros a partir de valor e preco por litro", () => {
    const result = solveFuelValues({
      totalCost: 78,
      pricePerLiter: 6.5,
    });

    expect(result.totalCost).toBe(78);
    expect(result.liters).toBe(12);
  });

  it("divide compra agrupada de filamentos em rolos", () => {
    const result = splitGroupedFilamentPurchase({
      totalCost: 200,
      totalWeightGrams: 4000,
      spoolCount: 4,
    });

    expect(result.nominalWeightGrams).toBe(1000);
    expect(result.purchaseCost).toBe(50);
    expect(result.costPerGram).toBe(0.05);
  });

  it("calcula custo e lucro de producao", () => {
    const metrics = calculateProductionMetrics({
      quantityProduced: 10,
      quantitySold: 8,
      printHours: 5,
      finishingHours: 2,
      additionalManualCost: 4,
      packagingCost: 6,
      salePriceTotal: 160,
      settings: {
        energyRatePerKwh: 1,
        printerPowerWatts: 100,
        extraFixedCostPerProduction: 2,
        manualLaborRatePerHour: 10,
      },
      usages: [
        {
          id: "u1",
          workspaceId: "w",
          productionJobId: "p",
          itemKind: "filament",
          itemId: "spool",
          itemName: "PLA Branco",
          quantity: 100,
          wasteQuantity: 20,
          unitCost: 0.05,
          totalCost: 6,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "u2",
          workspaceId: "w",
          productionJobId: "p",
          itemKind: "supply",
          itemId: "primer",
          itemName: "Primer",
          quantity: 30,
          wasteQuantity: 0,
          unitCost: 0.02,
          totalCost: 0.6,
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    expect(metrics.materialCost).toBe(5);
    expect(metrics.wasteCost).toBe(1);
    expect(metrics.totalCost).toBeGreaterThan(metrics.materialCost);
    expect(metrics.grossProfit).toBeGreaterThan(0);
  });
});
