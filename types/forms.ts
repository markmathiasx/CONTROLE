import type {
  CategoryScope,
  EntryKind,
  IncomeType,
  MaintenanceCategory,
  PaymentMethod,
  RecurrenceFrequency,
  StockItemKind,
  StockMovementKind,
  StoreOrderStatus,
  SupplyUnit,
  ThemeMode,
  WalletType,
} from "@/types/domain";

export interface EntryFormValues {
  id?: string;
  kind: EntryKind;
  description: string;
  amount: number;
  date: string;
  centerId: string;
  categoryId?: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  installments: number;
  notes?: string;
  incomeType: IncomeType;
  wallet: WalletType;
  recurrenceFrequency: RecurrenceFrequency | "none";
  recurrenceEndDate?: string;
}

export interface CategoryFormValues {
  id?: string;
  name: string;
  color: string;
  icon: string;
  keywords: string;
  budgetable: boolean;
  scope: CategoryScope;
}

export interface CardFormValues {
  id?: string;
  name: string;
  brand: string;
  last4: string;
  limit: number;
  bestPurchaseDay: number;
  dueDay: number;
  color: string;
  aliases: string;
}

export interface BudgetFormValues {
  id?: string;
  categoryId: string;
  month: string;
  limit: number;
}

export interface OperationalSettingsFormValues {
  energyRatePerKwh: number;
  printerPowerWatts: number;
  extraFixedCostPerProduction: number;
  manualLaborRatePerHour: number;
}

export interface SettingsFormValues {
  salaryMonthly: number;
  vrMonthly: number;
  salaryDay: number;
  vrDay: number;
  theme: ThemeMode;
  operationalSettings: OperationalSettingsFormValues;
}

export interface FuelLogFormValues {
  id?: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  totalCost?: number;
  pricePerLiter: number;
  liters?: number;
  station?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface MaintenanceLogFormValues {
  id?: string;
  vehicleId: string;
  date: string;
  odometerKm: number;
  type: string;
  category: MaintenanceCategory;
  description: string;
  totalCost: number;
  shop?: string;
  notes?: string;
  recurringMonths?: number;
  recurringKm?: number;
  paymentMethod: PaymentMethod;
}

export interface FilamentPurchaseFormValues {
  purchaseDate: string;
  totalCost: number;
  totalWeightGrams: number;
  spoolCount: number;
  material: string;
  color: string;
  brand: string;
  supplier?: string;
  notes?: string;
}

export interface SupplyItemFormValues {
  id?: string;
  name: string;
  category: string;
  unit: SupplyUnit;
  totalQuantity: number;
  totalCost: number;
  purchaseDate: string;
  notes?: string;
}

export interface StockAdjustmentFormValues {
  itemKind: StockItemKind;
  itemId: string;
  quantityDelta: number;
  occurredAt: string;
  notes?: string;
}

export interface FuelFilters {
  month: string;
  paymentMethod: PaymentMethod | "all";
  station: string;
}

export interface MaintenanceFilters {
  month: string;
  category: MaintenanceCategory | "all";
  reminderStatus: "all" | "overdue" | "upcoming" | "none";
}

export interface StockMovementFilters {
  month: string;
  itemKind: StockItemKind | "all";
  movementKind: StockMovementKind | "all";
}

export interface ProductionFilters {
  month: string;
  status: ProductionJobFormValues["status"] | "all";
  profitability: "all" | "profit" | "loss";
}

export interface OrderFilters {
  month: string;
  status: StoreOrderStatus | "all";
  query: string;
}

export interface ProductionMaterialInput {
  itemKind: "filament" | "supply";
  itemId: string;
  quantity: number;
  wasteQuantity?: number;
}

export interface ProductionJobFormValues {
  id?: string;
  name: string;
  client?: string;
  date: string;
  quantityProduced: number;
  quantitySold: number;
  status: "budget" | "in-production" | "ready" | "delivered" | "cancelled";
  printHours: number;
  finishingHours: number;
  additionalManualCost: number;
  packagingCost: number;
  salePriceUnit: number;
  salePriceTotal: number;
  notes?: string;
  materials: ProductionMaterialInput[];
}

export interface StoreOrderFormValues {
  id?: string;
  client?: string;
  productName: string;
  quantity: number;
  date: string;
  status: StoreOrderStatus;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  linkedProductionJobId?: string;
}
