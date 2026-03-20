export const costCenterKinds = [
  "me",
  "partner",
  "shared",
  "moto",
  "store",
] as const;
export type CostCenterKind = (typeof costCenterKinds)[number];

export const originModules = ["finance", "moto", "store"] as const;
export type OriginModule = (typeof originModules)[number];

export const paymentMethods = [
  "cash",
  "pix",
  "debit",
  "credit",
  "vr",
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const incomeTypes = [
  "salary",
  "vr",
  "freelance",
  "reimbursement",
  "sale",
  "other",
] as const;
export type IncomeType = (typeof incomeTypes)[number];

export const recurrenceFrequencies = ["weekly", "monthly", "yearly"] as const;
export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];

export const storageModes = ["local", "supabase"] as const;
export type StorageMode = (typeof storageModes)[number];

export const workspaceMemberRoles = ["owner", "member"] as const;
export type WorkspaceMemberRole = (typeof workspaceMemberRoles)[number];

export const entryKinds = ["expense", "income"] as const;
export type EntryKind = (typeof entryKinds)[number];

export const themeModes = ["dark", "light", "system"] as const;
export type ThemeMode = (typeof themeModes)[number];

export const wallets = ["cash", "vr"] as const;
export type WalletType = (typeof wallets)[number];

export const categoryScopes = ["finance", "moto", "store", "shared"] as const;
export type CategoryScope = (typeof categoryScopes)[number];

export const vehicleTypes = ["motorcycle", "car"] as const;
export type VehicleType = (typeof vehicleTypes)[number];

export const vehicleFixedCostKinds = [
  "ipva",
  "insurance",
  "licensing",
] as const;
export type VehicleFixedCostKind = (typeof vehicleFixedCostKinds)[number];

export const supplyUnits = ["g", "ml", "l", "unit", "sheet", "m"] as const;
export type SupplyUnit = (typeof supplyUnits)[number];

export const maintenanceCategories = [
  "troca-de-oleo",
  "filtro-de-oleo",
  "filtro-de-ar",
  "relacao",
  "pneu",
  "freio",
  "embreagem",
  "bateria",
  "eletrica",
  "revisao",
  "documentacao",
  "lavagem",
  "outros",
] as const;
export type MaintenanceCategory = (typeof maintenanceCategories)[number];

export const stockMovementKinds = [
  "purchase",
  "consume",
  "waste",
  "adjustment",
] as const;
export type StockMovementKind = (typeof stockMovementKinds)[number];

export const stockItemKinds = ["filament", "supply"] as const;
export type StockItemKind = (typeof stockItemKinds)[number];

export const productionStatuses = [
  "budget",
  "in-production",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type ProductionStatus = (typeof productionStatuses)[number];

export const storeOrderStatuses = [
  "budget",
  "in-production",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type StoreOrderStatus = (typeof storeOrderStatuses)[number];

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
}

export interface User extends BaseEntity {
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role: WorkspaceMemberRole;
}

export interface Workspace extends BaseEntity {
  name: string;
  slug: string;
  currency: "BRL";
  timezone: string;
  ownerUserId: string;
  isPersonal?: boolean | null;
  branding: {
    appName: string;
    accent: string;
    logoMode: "glyph" | "wordmark";
  };
}

export interface WorkspaceMember extends BaseEntity {
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
}

export interface UserSettingsRecord extends BaseEntity {
  userId: string;
  activeWorkspaceId?: string | null;
  theme: ThemeMode;
  onboardingCompleted: boolean;
  localImportDecision?: "merged" | "skipped" | null;
  importedFromLocalAt?: string | null;
  lastLocalMergeHash?: string | null;
}

export interface CostCenter extends BaseEntity {
  workspaceId: string;
  kind: CostCenterKind;
  name: string;
  color: string;
  icon: string;
  active: boolean;
  module: OriginModule | "shared";
}

export interface Category extends BaseEntity {
  workspaceId: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  keywords: string[];
  budgetable: boolean;
  system: boolean;
  scope: CategoryScope;
}

export interface CreditCard extends BaseEntity {
  workspaceId: string;
  name: string;
  brand: string;
  last4: string;
  limit: number;
  bestPurchaseDay: number;
  dueDay: number;
  color: string;
  aliases: string[];
  active: boolean;
}

export interface Transaction extends BaseEntity {
  workspaceId: string;
  centerId: string;
  categoryId: string;
  description: string;
  notes?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  cardId?: string | null;
  installments: number;
  recurrenceRuleId?: string | null;
  originModule: OriginModule;
  originRefId?: string | null;
  lockedByOrigin: boolean;
}

export interface TransactionInstallment extends BaseEntity {
  workspaceId: string;
  transactionId: string;
  cardId: string;
  categoryId: string;
  centerId: string;
  amount: number;
  installmentNumber: number;
  totalInstallments: number;
  invoiceMonth: string;
  dueDate: string;
  transactionDate: string;
}

export interface Income extends BaseEntity {
  workspaceId: string;
  centerId: string;
  description: string;
  amount: number;
  incomeType: IncomeType;
  wallet: WalletType;
  receivedAt: string;
  notes?: string | null;
  recurrenceRuleId?: string | null;
  originModule: OriginModule;
  originRefId?: string | null;
  lockedByOrigin: boolean;
}

export interface Budget extends BaseEntity {
  workspaceId: string;
  categoryId: string;
  month: string;
  limit: number;
}

export interface RecurrenceRule extends BaseEntity {
  workspaceId: string;
  kind: EntryKind;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate?: string | null;
  description: string;
  amount: number;
  centerId: string;
  categoryId?: string | null;
  paymentMethod?: PaymentMethod | null;
  cardId?: string | null;
  installments?: number | null;
  incomeType?: IncomeType | null;
  wallet?: WalletType | null;
}

export interface Vehicle extends BaseEntity {
  workspaceId: string;
  centerId: string;
  vehicleType?: VehicleType;
  brand: string;
  model: string;
  year: number;
  nickname: string;
  plate?: string | null;
  fuelType: string;
  currentOdometerKm: number;
  averageCityKmPerLiter?: number | null;
  averageHighwayKmPerLiter?: number | null;
  tankCapacityLiters?: number | null;
  monthlyDistanceGoalKm?: number | null;
  fixedCosts?: VehicleFixedCostSettings | null;
  notes?: string | null;
}

export interface VehicleFixedCostRule {
  enabled: boolean;
  amount: number;
  dueMonth: number;
  dueDay: number;
  notes?: string | null;
}

export interface VehicleFixedCostSettings {
  ipva?: VehicleFixedCostRule | null;
  insurance?: VehicleFixedCostRule | null;
  licensing?: VehicleFixedCostRule | null;
}

export interface FuelLog extends BaseEntity {
  workspaceId: string;
  centerId: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  totalCost: number;
  pricePerLiter: number;
  liters: number;
  station?: string | null;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
}

export interface MaintenanceLog extends BaseEntity {
  workspaceId: string;
  centerId: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  type: string;
  category: MaintenanceCategory;
  description: string;
  totalCost: number;
  shop?: string | null;
  notes?: string | null;
  recurringMonths?: number | null;
  recurringKm?: number | null;
  paymentMethod?: PaymentMethod | null;
  transactionId?: string | null;
}

export interface MaintenanceReminder {
  id: string;
  maintenanceLogId: string;
  title: string;
  dueDate?: string | null;
  dueKm?: number | null;
  isOverdue: boolean;
}

export interface OperationalSettings {
  energyRatePerKwh: number;
  printerPowerWatts: number;
  extraFixedCostPerProduction: number;
  manualLaborRatePerHour: number;
}

export interface FilamentSpool extends BaseEntity {
  workspaceId: string;
  centerId: string;
  name: string;
  material: string;
  color: string;
  brand: string;
  nominalWeightGrams: number;
  remainingWeightGrams: number;
  purchaseCost: number;
  costPerGram: number;
  purchaseDate: string;
  supplier?: string | null;
  lot?: string | null;
  notes?: string | null;
}

export interface SupplyItem extends BaseEntity {
  workspaceId: string;
  centerId: string;
  name: string;
  category: string;
  unit: SupplyUnit;
  totalQuantity: number;
  remainingQuantity: number;
  totalCost: number;
  unitCost: number;
  purchaseDate: string;
  notes?: string | null;
}

export interface StockMovement extends BaseEntity {
  workspaceId: string;
  centerId: string;
  itemKind: StockItemKind;
  itemId: string;
  itemName?: string | null;
  itemCategory?: string | null;
  movementKind: StockMovementKind;
  quantity: number;
  unitCost: number;
  totalCost: number;
  occurredAt: string;
  relatedProductionJobId?: string | null;
  notes?: string | null;
}

export interface ProductionMaterialUsage extends BaseEntity {
  workspaceId: string;
  productionJobId: string;
  itemKind: StockItemKind;
  itemId: string;
  itemName: string;
  itemCategory?: string | null;
  quantity: number;
  wasteQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface ProductionJob extends BaseEntity {
  workspaceId: string;
  centerId: string;
  name: string;
  client?: string | null;
  date: string;
  quantityProduced: number;
  quantitySold: number;
  status: ProductionStatus;
  printHours: number;
  finishingHours: number;
  additionalManualCost: number;
  packagingCost: number;
  salePriceUnit: number;
  salePriceTotal: number;
  notes?: string | null;
  energyCost: number;
  materialCost: number;
  wasteCost: number;
  supplyCost: number;
  paintCost?: number;
  otherSupplyCost?: number;
  finishingCost: number;
  fixedCostApplied?: number;
  totalCost: number;
  unitCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface StoreOrder extends BaseEntity {
  workspaceId: string;
  centerId: string;
  client?: string | null;
  productName: string;
  quantity: number;
  date: string;
  status: StoreOrderStatus;
  unitPrice: number;
  totalPrice: number;
  totalCostSnapshot: number;
  grossProfit: number;
  notes?: string | null;
  linkedProductionJobId?: string | null;
  incomeId?: string | null;
}

export interface AppSettings {
  currency: "BRL";
  locale: "pt-BR";
  theme: ThemeMode;
  salaryMonthly: number;
  vrMonthly: number;
  salaryDay: number;
  vrDay: number;
  activeCenterIds: string[];
  storageMode: StorageMode;
}

export interface CardInvoice {
  cardId: string;
  month: string;
  total: number;
  dueDate: string;
  limit: number;
  utilization: number;
  installments: TransactionInstallment[];
}

export interface WorkspaceMeta {
  schemaVersion: number;
  seededAt: string;
  updatedAt: string;
  lastSyncedAt?: string | null;
  importedFromLocalAt?: string | null;
  lastMergedAt?: string | null;
  lastMergedHash?: string | null;
  migrationOrigin?: string | null;
  dirty: boolean;
  source: "seed" | "local" | "remote";
  storageMode: StorageMode;
  appVersion: string;
}

export interface WorkspaceSnapshot {
  version: number;
  user: User;
  workspace: Workspace;
  costCenters: CostCenter[];
  categories: Category[];
  cards: CreditCard[];
  transactions: Transaction[];
  installments: TransactionInstallment[];
  incomes: Income[];
  budgets: Budget[];
  recurrences: RecurrenceRule[];
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  operationalSettings: OperationalSettings;
  filamentSpools: FilamentSpool[];
  supplyItems: SupplyItem[];
  stockMovements: StockMovement[];
  productionJobs: ProductionJob[];
  productionMaterialUsages: ProductionMaterialUsage[];
  storeOrders: StoreOrder[];
  settings: AppSettings;
  meta: WorkspaceMeta;
}

export interface QuickEntryDraft {
  kind: EntryKind;
  amount: number | null;
  description: string;
  paymentMethod: PaymentMethod;
  centerId: string;
  categoryId?: string | null;
  cardId?: string | null;
  installments: number;
  notes?: string;
  transactionDate: string;
  rawText: string;
  warnings: string[];
}

export interface QuickEntryContext {
  cards: CreditCard[];
  categories: Category[];
  costCenters: CostCenter[];
  defaultCenterId: string;
}

export interface RuntimeConfig {
  storageMode: StorageMode;
  hasSupabase: boolean;
  hasPinLock: boolean;
  hasUsernameAuth: boolean;
  hasOpenAI: boolean;
}

export interface SyncPayload {
  workspaceId: string;
  snapshot: WorkspaceSnapshot;
}
