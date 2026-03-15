import { describe, expect, it } from "vitest";

import { calculateProductionMetrics } from "@/utils/operations";
import { getMotoFuelInsights, getStoreMovementFeed } from "@/utils/finance";
import { createSeedSnapshot } from "@/utils/seed";

describe("moto + loja domain helpers", () => {
  it("calcula breakdown de producao com pintura, outros insumos e custo fixo", () => {
    const metrics = calculateProductionMetrics({
      quantityProduced: 2,
      quantitySold: 1,
      printHours: 2,
      finishingHours: 1,
      additionalManualCost: 10,
      packagingCost: 5,
      salePriceTotal: 100,
      settings: {
        energyRatePerKwh: 1,
        printerPowerWatts: 100,
        extraFixedCostPerProduction: 3,
        manualLaborRatePerHour: 20,
      },
      usages: [
        {
          id: "usage_filament",
          workspaceId: "workspace",
          productionJobId: "job",
          itemKind: "filament",
          itemId: "spool_1",
          itemName: "PLA Branco",
          itemCategory: "PLA • Branco",
          quantity: 100,
          wasteQuantity: 10,
          unitCost: 0.05,
          totalCost: 5.5,
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
        },
        {
          id: "usage_paint",
          workspaceId: "workspace",
          productionJobId: "job",
          itemKind: "supply",
          itemId: "supply_1",
          itemName: "Primer branco",
          itemCategory: "Primer branco",
          quantity: 10,
          wasteQuantity: 0,
          unitCost: 1,
          totalCost: 10,
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
        },
        {
          id: "usage_other",
          workspaceId: "workspace",
          productionJobId: "job",
          itemKind: "supply",
          itemId: "supply_2",
          itemName: "Embalagem kraft",
          itemCategory: "Embalagem",
          quantity: 3,
          wasteQuantity: 0,
          unitCost: 2,
          totalCost: 6,
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
        },
      ],
    });

    expect(metrics.materialCost).toBe(5);
    expect(metrics.wasteCost).toBe(0.5);
    expect(metrics.paintCost).toBe(10);
    expect(metrics.otherSupplyCost).toBe(6);
    expect(metrics.fixedCostApplied).toBe(3);
    expect(metrics.totalWasteQuantity).toBe(10);
    expect(metrics.totalCost).toBe(59.7);
  });

  it("resume abastecimentos com media de preco, ticket e ultimo odometro", () => {
    const snapshot = createSeedSnapshot("local");
    snapshot.fuelLogs = [
      {
        ...snapshot.fuelLogs[0],
        id: "fuel_1",
        date: "2026-03-10",
        odometerKm: 1250,
        totalCost: 40,
        liters: 8,
        pricePerLiter: 5,
      },
      {
        ...snapshot.fuelLogs[0],
        id: "fuel_2",
        date: "2026-03-12",
        odometerKm: 1320,
        totalCost: 33,
        liters: 6,
        pricePerLiter: 5.5,
      },
    ];

    const insights = getMotoFuelInsights(snapshot, "2026-03");

    expect(insights.totalCost).toBe(73);
    expect(insights.totalLiters).toBe(14);
    expect(insights.averagePricePerLiter).toBeCloseTo(5.21, 2);
    expect(insights.averageTicket).toBe(36.5);
    expect(insights.lastOdometerKm).toBe(1320);
  });

  it("enriquece o feed de movimentacoes com nome e categoria do item", () => {
    const snapshot = createSeedSnapshot("local");
    const spool = snapshot.filamentSpools[0];
    snapshot.stockMovements = [
      {
        ...snapshot.stockMovements[0],
        id: "move_adjust",
        itemKind: "filament",
        itemId: spool.id,
        itemName: null,
        itemCategory: null,
        movementKind: "adjustment",
        quantity: -50,
        unitCost: spool.costPerGram,
        totalCost: -50 * spool.costPerGram,
        occurredAt: "2026-03-14",
        relatedProductionJobId: null,
        notes: "Conferencia",
      },
    ];

    const feed = getStoreMovementFeed(snapshot, {
      month: "2026-03",
      itemKind: "all",
      movementKind: "adjustment",
    });

    expect(feed).toHaveLength(1);
    expect(feed[0]?.itemName).toBe(spool.name);
    expect(feed[0]?.itemCategory).toContain(spool.material);
  });
});
