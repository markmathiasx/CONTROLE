import { roundCurrency } from "@/lib/utils";
import type {
  OperationalSettings,
  ProductionMaterialUsage,
  StockItemKind,
  SupplyItem,
  FilamentSpool,
} from "@/types/domain";

const paintSupplyCategoryKeywords = [
  "tinta",
  "primer",
  "verniz",
  "lixa",
  "fita",
  "pincel",
  "solvente",
  "cola",
  "acabamento",
  "pintura",
];

function normalizeCategory(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isPaintSupplyCategory(category?: string | null) {
  const normalized = normalizeCategory(category);
  return paintSupplyCategoryKeywords.some((keyword) => normalized.includes(keyword));
}

export function solveFuelValues(params: {
  totalCost?: number;
  pricePerLiter: number;
  liters?: number;
}) {
  const pricePerLiter = params.pricePerLiter;
  const totalCost = params.totalCost ?? 0;
  const liters = params.liters ?? 0;

  if (totalCost > 0 && liters <= 0) {
    return {
      totalCost: roundCurrency(totalCost),
      liters: roundCurrency(totalCost / pricePerLiter),
    };
  }

  if (liters > 0 && totalCost <= 0) {
    return {
      totalCost: roundCurrency(liters * pricePerLiter),
      liters: roundCurrency(liters),
    };
  }

  return {
    totalCost: roundCurrency(totalCost),
    liters: roundCurrency(liters),
  };
}

export function splitGroupedFilamentPurchase(params: {
  totalCost: number;
  totalWeightGrams: number;
  spoolCount: number;
}) {
  const spoolCount = Math.max(1, params.spoolCount);
  const nominalWeightGrams = roundCurrency(params.totalWeightGrams / spoolCount);
  const purchaseCost = roundCurrency(params.totalCost / spoolCount);
  const costPerGram = nominalWeightGrams
    ? roundCurrency(purchaseCost / nominalWeightGrams)
    : 0;

  return {
    nominalWeightGrams,
    purchaseCost,
    costPerGram,
  };
}

function sumUsageCost(
  usages: Array<ProductionMaterialUsage & { itemKind: StockItemKind }>,
  kind: StockItemKind,
) {
  return usages
    .filter((usage) => usage.itemKind === kind)
    .reduce((sum, usage) => sum + usage.totalCost, 0);
}

export function calculateProductionMetrics(params: {
  quantityProduced: number;
  quantitySold: number;
  printHours: number;
  finishingHours: number;
  additionalManualCost: number;
  packagingCost: number;
  salePriceTotal: number;
  settings: OperationalSettings;
  usages: Array<ProductionMaterialUsage & { itemKind: StockItemKind }>;
}) {
  const filamentUsage = params.usages.filter((usage) => usage.itemKind === "filament");
  const supplyUsage = params.usages.filter((usage) => usage.itemKind === "supply");

  const materialCost = roundCurrency(
    filamentUsage.reduce(
      (sum, usage) => sum + usage.quantity * usage.unitCost,
      0,
    ),
  );
  const wasteCost = roundCurrency(
    filamentUsage.reduce(
      (sum, usage) => sum + usage.wasteQuantity * usage.unitCost,
      0,
    ),
  );
  const supplyCost = roundCurrency(sumUsageCost(supplyUsage, "supply"));
  const paintCost = roundCurrency(
    supplyUsage
      .filter((usage) => isPaintSupplyCategory(usage.itemCategory))
      .reduce((sum, usage) => sum + usage.totalCost, 0),
  );
  const otherSupplyCost = roundCurrency(supplyCost - paintCost);
  const energyCost = roundCurrency(
    (params.settings.printerPowerWatts / 1000) *
      params.printHours *
      params.settings.energyRatePerKwh,
  );
  const finishingCost = roundCurrency(
    params.finishingHours * params.settings.manualLaborRatePerHour,
  );
  const fixedCostApplied = roundCurrency(params.settings.extraFixedCostPerProduction);
  const totalMaterialQuantity = roundCurrency(
    filamentUsage.reduce((sum, usage) => sum + usage.quantity, 0),
  );
  const totalWasteQuantity = roundCurrency(
    filamentUsage.reduce((sum, usage) => sum + usage.wasteQuantity, 0),
  );
  const totalCost = roundCurrency(
    materialCost +
      wasteCost +
      supplyCost +
      energyCost +
      finishingCost +
      params.additionalManualCost +
      params.packagingCost +
      fixedCostApplied,
  );
  const unitCost = params.quantityProduced
    ? roundCurrency(totalCost / params.quantityProduced)
    : 0;
  const recognizedCost = roundCurrency(unitCost * params.quantitySold);
  const grossProfit = roundCurrency(params.salePriceTotal - recognizedCost);
  const marginPercent = params.salePriceTotal
    ? roundCurrency((grossProfit / params.salePriceTotal) * 100)
    : 0;

  return {
    materialCost,
    wasteCost,
    supplyCost,
    paintCost,
    otherSupplyCost,
    energyCost,
    finishingCost,
    fixedCostApplied,
    totalCost,
    unitCost,
    recognizedCost,
    grossProfit,
    marginPercent,
    totalMaterialQuantity,
    totalWasteQuantity,
  };
}

export function getItemUnitCost(item: FilamentSpool | SupplyItem) {
  return "costPerGram" in item ? item.costPerGram : item.unitCost;
}
