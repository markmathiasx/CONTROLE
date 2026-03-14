import { z } from "zod";

import {
  categoryScopes,
  costCenterKinds,
  entryKinds,
  incomeTypes,
  maintenanceCategories,
  originModules,
  paymentMethods,
  productionStatuses,
  recurrenceFrequencies,
  stockItemKinds,
  stockMovementKinds,
  storageModes,
  storeOrderStatuses,
  supplyUnits,
  themeModes,
  wallets,
} from "@/types/domain";

const dateString = z.string().min(1);

export const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: dateString,
  updatedAt: dateString,
  archivedAt: dateString.nullish(),
});

export const userSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  email: z.string().email().nullish(),
  role: z.enum(["owner", "member"]),
});

export const workspaceSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  slug: z.string().min(1),
  currency: z.literal("BRL"),
  timezone: z.string().min(1),
  ownerUserId: z.string().min(1),
  branding: z.object({
    appName: z.string().min(1),
    accent: z.string().min(1),
    logoMode: z.enum(["glyph", "wordmark"]),
  }),
});

export const costCenterSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  kind: z.enum(costCenterKinds),
  name: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
  active: z.boolean(),
  module: z.enum(["finance", "moto", "store", "shared"]),
});

export const categorySchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
  keywords: z.array(z.string()),
  budgetable: z.boolean(),
  system: z.boolean(),
  scope: z.enum(categoryScopes),
});

export const creditCardSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  last4: z.string().min(1),
  limit: z.number().nonnegative(),
  bestPurchaseDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  color: z.string().min(1),
  aliases: z.array(z.string()),
  active: z.boolean(),
});

export const transactionSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().min(1),
  notes: z.string().nullish(),
  amount: z.number().positive(),
  paymentMethod: z.enum(paymentMethods),
  transactionDate: dateString,
  cardId: z.string().nullish(),
  installments: z.number().int().min(1),
  recurrenceRuleId: z.string().nullish(),
  originModule: z.enum(originModules),
  originRefId: z.string().nullish(),
  lockedByOrigin: z.boolean(),
});

export const installmentSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  transactionId: z.string().min(1),
  cardId: z.string().min(1),
  categoryId: z.string().min(1),
  centerId: z.string().min(1),
  amount: z.number().positive(),
  installmentNumber: z.number().int().min(1),
  totalInstallments: z.number().int().min(1),
  invoiceMonth: z.string().regex(/^\d{4}-\d{2}$/),
  dueDate: dateString,
  transactionDate: dateString,
});

export const incomeSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  incomeType: z.enum(incomeTypes),
  wallet: z.enum(wallets),
  receivedAt: dateString,
  notes: z.string().nullish(),
  recurrenceRuleId: z.string().nullish(),
  originModule: z.enum(originModules),
  originRefId: z.string().nullish(),
  lockedByOrigin: z.boolean(),
});

export const budgetSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  categoryId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  limit: z.number().nonnegative(),
});

export const recurrenceSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  kind: z.enum(entryKinds),
  frequency: z.enum(recurrenceFrequencies),
  interval: z.number().int().min(1),
  startDate: dateString,
  endDate: dateString.nullish(),
  description: z.string().min(1),
  amount: z.number().positive(),
  centerId: z.string().min(1),
  categoryId: z.string().nullish(),
  paymentMethod: z.enum(paymentMethods).nullish(),
  cardId: z.string().nullish(),
  installments: z.number().int().min(1).nullish(),
  incomeType: z.enum(incomeTypes).nullish(),
  wallet: z.enum(wallets).nullish(),
});

export const vehicleSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900),
  nickname: z.string().min(1),
  plate: z.string().nullish(),
  fuelType: z.string().min(1),
  currentOdometerKm: z.number().nonnegative(),
});

export const fuelLogSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  vehicleId: z.string().min(1),
  date: dateString,
  odometerKm: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  pricePerLiter: z.number().positive(),
  liters: z.number().positive(),
  station: z.string().nullish(),
  notes: z.string().nullish(),
  paymentMethod: z.enum(paymentMethods),
  transactionId: z.string().nullish(),
});

export const maintenanceLogSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  vehicleId: z.string().min(1),
  date: dateString,
  odometerKm: z.number().nonnegative(),
  type: z.string().min(1),
  category: z.enum(maintenanceCategories),
  description: z.string().min(1),
  totalCost: z.number().nonnegative(),
  shop: z.string().nullish(),
  notes: z.string().nullish(),
  recurringMonths: z.number().int().positive().nullish(),
  recurringKm: z.number().int().positive().nullish(),
  transactionId: z.string().nullish(),
});

export const operationalSettingsSchema = z.object({
  energyRatePerKwh: z.number().nonnegative(),
  printerPowerWatts: z.number().nonnegative(),
  extraFixedCostPerProduction: z.number().nonnegative(),
  manualLaborRatePerHour: z.number().nonnegative(),
});

export const filamentSpoolSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  name: z.string().min(1),
  material: z.string().min(1),
  color: z.string().min(1),
  brand: z.string().min(1),
  nominalWeightGrams: z.number().positive(),
  remainingWeightGrams: z.number().nonnegative(),
  purchaseCost: z.number().nonnegative(),
  costPerGram: z.number().nonnegative(),
  purchaseDate: dateString,
  supplier: z.string().nullish(),
  lot: z.string().nullish(),
  notes: z.string().nullish(),
});

export const supplyItemSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.enum(supplyUnits),
  totalQuantity: z.number().positive(),
  remainingQuantity: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  purchaseDate: dateString,
  notes: z.string().nullish(),
});

export const stockMovementSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  itemKind: z.enum(stockItemKinds),
  itemId: z.string().min(1),
  movementKind: z.enum(stockMovementKinds),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  occurredAt: dateString,
  relatedProductionJobId: z.string().nullish(),
  notes: z.string().nullish(),
});

export const productionMaterialUsageSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  productionJobId: z.string().min(1),
  itemKind: z.enum(stockItemKinds),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().nonnegative(),
  wasteQuantity: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
});

export const productionJobSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  name: z.string().min(1),
  client: z.string().nullish(),
  date: dateString,
  quantityProduced: z.number().int().positive(),
  quantitySold: z.number().int().nonnegative(),
  status: z.enum(productionStatuses),
  printHours: z.number().nonnegative(),
  finishingHours: z.number().nonnegative(),
  additionalManualCost: z.number().nonnegative(),
  packagingCost: z.number().nonnegative(),
  salePriceUnit: z.number().nonnegative(),
  salePriceTotal: z.number().nonnegative(),
  notes: z.string().nullish(),
  energyCost: z.number().nonnegative(),
  materialCost: z.number().nonnegative(),
  wasteCost: z.number().nonnegative(),
  supplyCost: z.number().nonnegative(),
  finishingCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  grossProfit: z.number(),
  marginPercent: z.number(),
});

export const storeOrderSchema = baseEntitySchema.extend({
  workspaceId: z.string().min(1),
  centerId: z.string().min(1),
  client: z.string().nullish(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  date: dateString,
  status: z.enum(storeOrderStatuses),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  totalCostSnapshot: z.number().nonnegative(),
  grossProfit: z.number(),
  notes: z.string().nullish(),
  linkedProductionJobId: z.string().nullish(),
  incomeId: z.string().nullish(),
});

export const appSettingsSchema = z.object({
  currency: z.literal("BRL"),
  locale: z.literal("pt-BR"),
  theme: z.enum(themeModes),
  salaryMonthly: z.number().nonnegative(),
  vrMonthly: z.number().nonnegative(),
  salaryDay: z.number().int().min(1).max(31),
  vrDay: z.number().int().min(1).max(31),
  activeCenterIds: z.array(z.string()),
  storageMode: z.enum(storageModes),
});

export const workspaceMetaSchema = z.object({
  schemaVersion: z.number().int().min(1),
  seededAt: dateString,
  updatedAt: dateString,
  lastSyncedAt: dateString.nullish(),
  dirty: z.boolean(),
  source: z.enum(["seed", "local", "remote"]),
  storageMode: z.enum(storageModes),
  appVersion: z.string().min(1),
});

export const workspaceSnapshotSchema = z.object({
  version: z.number().int().min(1),
  user: userSchema,
  workspace: workspaceSchema,
  costCenters: z.array(costCenterSchema),
  categories: z.array(categorySchema),
  cards: z.array(creditCardSchema),
  transactions: z.array(transactionSchema),
  installments: z.array(installmentSchema),
  incomes: z.array(incomeSchema),
  budgets: z.array(budgetSchema),
  recurrences: z.array(recurrenceSchema),
  vehicles: z.array(vehicleSchema),
  fuelLogs: z.array(fuelLogSchema),
  maintenanceLogs: z.array(maintenanceLogSchema),
  operationalSettings: operationalSettingsSchema,
  filamentSpools: z.array(filamentSpoolSchema),
  supplyItems: z.array(supplyItemSchema),
  stockMovements: z.array(stockMovementSchema),
  productionJobs: z.array(productionJobSchema),
  productionMaterialUsages: z.array(productionMaterialUsageSchema),
  storeOrders: z.array(storeOrderSchema),
  settings: appSettingsSchema,
  meta: workspaceMetaSchema,
});
