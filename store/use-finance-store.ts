"use client";

import { create } from "zustand";

import { localDbAdapter } from "@/adapters/storage/local-db";
import { supabaseStorageAdapter } from "@/adapters/storage/supabase-storage";
import { parseWorkspaceSnapshot, withStorageMode } from "@/lib/snapshot-migrations";
import { createId, formatMonthKey, roundCurrency, slugify } from "@/lib/utils";
import type { RuntimeConfig, WorkspaceSnapshot } from "@/types/domain";
import type {
  BudgetFormValues,
  CardFormValues,
  CategoryFormValues,
  EntryFormValues,
  FilamentPurchaseFormValues,
  FuelLogFormValues,
  MaintenanceLogFormValues,
  ProductionJobFormValues,
  SettingsFormValues,
  StockAdjustmentFormValues,
  StoreOrderFormValues,
  SupplyItemFormValues,
  VehicleFormValues,
} from "@/types/forms";
import { generateInstallmentsForTransaction } from "@/utils/installments";
import {
  calculateProductionMetrics,
  getItemUnitCost,
  solveFuelValues,
  splitGroupedFilamentPurchase,
} from "@/utils/operations";
import { createSeedSnapshot } from "@/utils/seed";

type SyncStatus = "idle" | "local" | "syncing" | "synced" | "error";

interface FinanceState {
  runtimeConfig: RuntimeConfig;
  initialized: boolean;
  selectedMonth: string;
  snapshot: WorkspaceSnapshot | null;
  activeWorkspaceId: string | null;
  activeUserId: string | null;
  syncStatus: SyncStatus;
  quickAddOpen: boolean;
  moreMenuOpen: boolean;
  bootstrap: (config: RuntimeConfig) => Promise<void>;
  hydrateWorkspace: (params: {
    config: RuntimeConfig;
    snapshot: WorkspaceSnapshot;
    workspaceId: string | null;
    userId: string | null;
    syncStatus?: SyncStatus;
  }) => Promise<void>;
  clearWorkspaceState: () => void;
  setSelectedMonth: (month: string) => void;
  setQuickAddOpen: (open: boolean) => void;
  setMoreMenuOpen: (open: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  markSynced: (timestamp?: string) => Promise<void>;
  persistNow: () => Promise<void>;
  saveEntry: (values: EntryFormValues) => void;
  deleteEntry: (id: string, kind: "expense" | "income") => void;
  saveCategory: (values: CategoryFormValues) => void;
  archiveCategory: (id: string) => void;
  saveCard: (values: CardFormValues) => void;
  archiveCard: (id: string) => void;
  saveBudget: (values: BudgetFormValues) => void;
  updateSettings: (values: SettingsFormValues) => void;
  toggleCenterActive: (centerId: string) => void;
  toggleProfileActive: (centerId: string) => void;
  saveFuelLog: (values: FuelLogFormValues) => void;
  deleteFuelLog: (id: string) => void;
  saveVehicle: (values: VehicleFormValues) => void;
  deleteVehicle: (id: string) => void;
  saveMaintenanceLog: (values: MaintenanceLogFormValues) => void;
  deleteMaintenanceLog: (id: string) => void;
  saveFilamentPurchase: (values: FilamentPurchaseFormValues) => void;
  saveSupplyItem: (values: SupplyItemFormValues) => void;
  saveStockAdjustment: (values: StockAdjustmentFormValues) => void;
  saveProductionJob: (values: ProductionJobFormValues) => void;
  deleteProductionJob: (id: string) => void;
  saveStoreOrder: (values: StoreOrderFormValues) => void;
  deleteStoreOrder: (id: string) => void;
  importSnapshot: (snapshot: WorkspaceSnapshot | unknown) => void;
  resetWorkspace: () => void;
}

function getDefaultRuntimeConfig(): RuntimeConfig {
  return { storageMode: "local", hasSupabase: false, hasPinLock: false, hasUsernameAuth: false };
}

function cloneSnapshot(snapshot: WorkspaceSnapshot) {
  return structuredClone(snapshot);
}

function touchSnapshot(snapshot: WorkspaceSnapshot, source: "local" | "remote" = "local") {
  snapshot.version += 1;
  snapshot.meta.updatedAt = new Date().toISOString();
  snapshot.meta.dirty = true;
  snapshot.meta.source = source;
}

function updateSnapshot(current: WorkspaceSnapshot | null, updater: (draft: WorkspaceSnapshot) => void) {
  if (!current) {
    return null;
  }

  const next = cloneSnapshot(current);
  updater(next);
  touchSnapshot(next);
  return next;
}

function getCategoryIdBySlug(snapshot: WorkspaceSnapshot, slug: string) {
  return (
    snapshot.categories.find((item) => item.slug === slug && !item.archivedAt)?.id ??
    snapshot.categories.find((item) => !item.archivedAt)?.id ??
    ""
  );
}

function getCenterIdByKind(
  snapshot: WorkspaceSnapshot,
  kind: "me" | "partner" | "shared" | "moto" | "store",
) {
  return snapshot.costCenters.find((item) => item.kind === kind)?.id ?? snapshot.costCenters[0]?.id ?? "";
}

function removeInstallmentsForTransaction(snapshot: WorkspaceSnapshot, transactionId: string) {
  snapshot.installments = snapshot.installments.filter((item) => item.transactionId !== transactionId);
}

function resolveActorUserId(snapshot: WorkspaceSnapshot, activeUserId?: string | null) {
  return activeUserId ?? snapshot.user.id ?? null;
}

function applyAuditFields<
  T extends {
    createdAt: string;
    updatedAt: string;
    createdByUserId?: string | null;
    updatedByUserId?: string | null;
  },
>(
  payload: T,
  actorUserId: string | null,
  existing?: { createdByUserId?: string | null; updatedByUserId?: string | null } | null,
) {
  return {
    ...payload,
    createdByUserId: existing?.createdByUserId ?? payload.createdByUserId ?? actorUserId,
    updatedByUserId: actorUserId,
  };
}

function upsertRecurrenceForEntry(
  snapshot: WorkspaceSnapshot,
  values: EntryFormValues,
  actorUserId: string | null,
  recurrenceRuleId?: string | null,
) {
  const now = new Date().toISOString();

  if (values.recurrenceFrequency === "none") {
    if (recurrenceRuleId) {
      snapshot.recurrences = snapshot.recurrences.filter((rule) => rule.id !== recurrenceRuleId);
    }
    return null;
  }

  const nextRuleId = recurrenceRuleId ?? createId("rec");
  const existingIndex = snapshot.recurrences.findIndex((rule) => rule.id === nextRuleId);
  const existing = existingIndex >= 0 ? snapshot.recurrences[existingIndex] : null;
  const baseRule = applyAuditFields({
    id: nextRuleId,
    workspaceId: snapshot.workspace.id,
    kind: values.kind,
    frequency: values.recurrenceFrequency,
    interval: 1,
    startDate: values.date,
    endDate: values.recurrenceEndDate || null,
    description: values.description,
    amount: values.amount,
    centerId: values.centerId,
    categoryId: values.kind === "expense" ? (values.categoryId ?? null) : null,
    paymentMethod: values.kind === "expense" ? values.paymentMethod : null,
    cardId: values.kind === "expense" ? (values.cardId ?? null) : null,
    installments: values.kind === "expense" ? values.installments : null,
    incomeType: values.kind === "income" ? values.incomeType : null,
    wallet: values.kind === "income" ? values.wallet : null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }, actorUserId, existing);

  if (existingIndex >= 0) {
    snapshot.recurrences[existingIndex] = { ...snapshot.recurrences[existingIndex], ...baseRule, updatedAt: now };
  } else {
    snapshot.recurrences.push(baseRule);
  }

  return nextRuleId;
}

function findOriginTransaction(snapshot: WorkspaceSnapshot, originModule: "moto" | "store", originRefId: string) {
  return snapshot.transactions.find((item) => item.originModule === originModule && item.originRefId === originRefId);
}

function removeOriginTransaction(snapshot: WorkspaceSnapshot, originModule: "moto" | "store", originRefId: string) {
  const current = findOriginTransaction(snapshot, originModule, originRefId);
  if (!current) {
    return;
  }

  snapshot.transactions = snapshot.transactions.filter((item) => item.id !== current.id);
  removeInstallmentsForTransaction(snapshot, current.id);
}

function upsertOriginExpense(
  snapshot: WorkspaceSnapshot,
  actorUserId: string | null,
  params: {
    originModule: "moto" | "store";
    originRefId: string;
    centerId: string;
    categoryId: string;
    description: string;
    amount: number;
    paymentMethod: "cash" | "pix" | "debit" | "credit" | "vr";
    transactionDate: string;
    cardId?: string;
    installments?: number;
  },
) {
  const now = new Date().toISOString();
  const existing = findOriginTransaction(snapshot, params.originModule, params.originRefId);
  const payload = applyAuditFields({
    id: existing?.id ?? createId("tx"),
    workspaceId: snapshot.workspace.id,
    centerId: params.centerId,
    categoryId: params.categoryId,
    description: params.description,
    amount: roundCurrency(params.amount),
    paymentMethod: params.paymentMethod,
    transactionDate: params.transactionDate,
    cardId: params.cardId ?? null,
    installments: params.installments ?? 1,
    recurrenceRuleId: null,
    originModule: params.originModule,
    originRefId: params.originRefId,
    lockedByOrigin: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }, actorUserId, existing);

  snapshot.transactions = snapshot.transactions.filter((item) => item.id !== payload.id);
  snapshot.transactions.unshift(payload);
  removeInstallmentsForTransaction(snapshot, payload.id);

  if (payload.paymentMethod === "credit" && payload.cardId) {
    const card = snapshot.cards.find((item) => item.id === payload.cardId);
    if (card) {
      snapshot.installments.push(
        ...generateInstallmentsForTransaction({
          transaction: payload,
          card,
          workspaceId: snapshot.workspace.id,
          createdAt: now,
          actorUserId,
        }),
      );
    }
  }

  return payload.id;
}

function findOriginIncome(snapshot: WorkspaceSnapshot, originRefId: string) {
  return snapshot.incomes.find((item) => item.originModule === "store" && item.originRefId === originRefId);
}

function upsertOriginIncome(
  snapshot: WorkspaceSnapshot,
  actorUserId: string | null,
  params: { originRefId: string; centerId: string; description: string; amount: number; receivedAt: string },
) {
  const now = new Date().toISOString();
  const existing = findOriginIncome(snapshot, params.originRefId);
  const payload = applyAuditFields({
    id: existing?.id ?? createId("income"),
    workspaceId: snapshot.workspace.id,
    centerId: params.centerId,
    description: params.description,
    amount: roundCurrency(params.amount),
    incomeType: "sale" as const,
    wallet: "cash" as const,
    receivedAt: params.receivedAt,
    recurrenceRuleId: null,
    originModule: "store" as const,
    originRefId: params.originRefId,
    lockedByOrigin: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }, actorUserId, existing);

  snapshot.incomes = snapshot.incomes.filter((item) => item.id !== payload.id);
  snapshot.incomes.unshift(payload);
  return payload.id;
}

function removeOriginIncome(snapshot: WorkspaceSnapshot, originRefId: string) {
  snapshot.incomes = snapshot.incomes.filter((item) => !(item.originModule === "store" && item.originRefId === originRefId));
}

function recalculateVehicleOdometer(snapshot: WorkspaceSnapshot, vehicleId: string, actorUserId: string | null) {
  const vehicle = snapshot.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return;
  }

  const latestLoggedOdometer = Math.max(
    ...snapshot.fuelLogs
      .filter((item) => item.vehicleId === vehicleId)
      .map((item) => item.odometerKm),
    ...snapshot.maintenanceLogs
      .filter((item) => item.vehicleId === vehicleId)
      .map((item) => item.odometerKm),
  );

  if (Number.isFinite(latestLoggedOdometer)) {
    vehicle.currentOdometerKm = latestLoggedOdometer;
  }

  vehicle.updatedAt = new Date().toISOString();
  vehicle.updatedByUserId = actorUserId;
}

function restoreProductionInventory(snapshot: WorkspaceSnapshot, productionJobId: string, actorUserId: string | null) {
  const usages = snapshot.productionMaterialUsages.filter((usage) => usage.productionJobId === productionJobId);

  usages.forEach((usage) => {
    if (usage.itemKind === "filament") {
      const spool = snapshot.filamentSpools.find((item) => item.id === usage.itemId);
      if (spool) {
        spool.remainingWeightGrams = roundCurrency(spool.remainingWeightGrams + usage.quantity + usage.wasteQuantity);
        spool.updatedAt = new Date().toISOString();
        spool.updatedByUserId = actorUserId;
      }
    } else {
      const supply = snapshot.supplyItems.find((item) => item.id === usage.itemId);
      if (supply) {
        supply.remainingQuantity = roundCurrency(supply.remainingQuantity + usage.quantity + usage.wasteQuantity);
        supply.updatedAt = new Date().toISOString();
        supply.updatedByUserId = actorUserId;
      }
    }
  });

  snapshot.stockMovements = snapshot.stockMovements.filter((movement) => movement.relatedProductionJobId !== productionJobId);
  snapshot.productionMaterialUsages = snapshot.productionMaterialUsages.filter((usage) => usage.productionJobId !== productionJobId);
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  runtimeConfig: getDefaultRuntimeConfig(),
  initialized: false,
  selectedMonth: formatMonthKey(new Date()),
  snapshot: null,
  activeWorkspaceId: null,
  activeUserId: null,
  syncStatus: "idle",
  quickAddOpen: false,
  moreMenuOpen: false,
  async bootstrap(config) {
    if (get().initialized) {
      return;
    }

    const migratedSnapshot = await localDbAdapter.migrateFromLegacyLocalStorage();
    let snapshot = migratedSnapshot ?? (await localDbAdapter.loadAnonymous()) ?? createSeedSnapshot(config.storageMode);
    snapshot = withStorageMode(snapshot, config);
    await localDbAdapter.saveAnonymous(snapshot);
    set({
      runtimeConfig: config,
      initialized: true,
      selectedMonth: formatMonthKey(new Date()),
      snapshot,
      activeWorkspaceId: snapshot.workspace.id,
      activeUserId: snapshot.user.id,
      syncStatus: "local",
    });
  },
  async hydrateWorkspace({ config, snapshot, workspaceId, userId, syncStatus = "synced" }) {
    const nextSnapshot = withStorageMode(snapshot, config);

    if (config.storageMode === "supabase" && workspaceId) {
      await localDbAdapter.saveWorkspace(workspaceId, nextSnapshot);
    } else {
      await localDbAdapter.saveAnonymous(nextSnapshot);
    }

    set({
      runtimeConfig: config,
      initialized: true,
      selectedMonth: formatMonthKey(new Date()),
      snapshot: nextSnapshot,
      activeWorkspaceId: workspaceId,
      activeUserId: userId,
      syncStatus,
    });
  },
  clearWorkspaceState() {
    set({
      initialized: false,
      snapshot: null,
      activeWorkspaceId: null,
      activeUserId: null,
      syncStatus: "idle",
      quickAddOpen: false,
      moreMenuOpen: false,
    });
  },
  setSelectedMonth(month) {
    set({ selectedMonth: month });
  },
  setQuickAddOpen(open) {
    set({ quickAddOpen: open });
  },
  setMoreMenuOpen(open) {
    set({ moreMenuOpen: open });
  },
  setSyncStatus(status) {
    set({ syncStatus: status });
  },
  async markSynced(timestamp = new Date().toISOString()) {
    const { snapshot, activeWorkspaceId, runtimeConfig } = get();
    if (!snapshot) {
      return;
    }

    const next = cloneSnapshot(snapshot);
    next.meta.dirty = false;
    next.meta.lastSyncedAt = timestamp;
    if (runtimeConfig.storageMode === "supabase" && activeWorkspaceId) {
      await localDbAdapter.saveWorkspace(activeWorkspaceId, next);
    } else {
      await localDbAdapter.saveAnonymous(next);
    }
    set({ snapshot: next, syncStatus: "synced" });
  },
  async persistNow() {
    const { snapshot, runtimeConfig, activeWorkspaceId, activeUserId } = get();
    if (!snapshot) {
      return;
    }

    if (runtimeConfig.storageMode === "supabase" && activeWorkspaceId) {
      await localDbAdapter.saveWorkspace(activeWorkspaceId, snapshot);
      set({ syncStatus: "syncing" });
      try {
        if (!activeUserId) {
          throw new Error("Usuário autenticado não encontrado.");
        }
        await supabaseStorageAdapter.save(activeWorkspaceId, snapshot, activeUserId);
        await get().markSynced();
      } catch {
        set({ syncStatus: "error" });
      }
    } else {
      await localDbAdapter.saveAnonymous(snapshot);
      set({ syncStatus: "local" });
    }
  },
  saveEntry(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const recurrenceRuleId = upsertRecurrenceForEntry(
        draft,
        values,
        actorUserId,
        values.id
          ? values.kind === "expense"
            ? draft.transactions.find((item) => item.id === values.id)?.recurrenceRuleId
            : draft.incomes.find((item) => item.id === values.id)?.recurrenceRuleId
          : undefined,
      );

      if (values.kind === "expense") {
        const existingIndex = values.id ? draft.transactions.findIndex((item) => item.id === values.id) : -1;
        const existing = existingIndex >= 0 ? draft.transactions[existingIndex] : null;
        const expense = applyAuditFields({
          id: values.id ?? createId("tx"),
          workspaceId: draft.workspace.id,
          centerId: values.centerId,
          categoryId: values.categoryId ?? draft.categories[0]?.id ?? "",
          description: values.description,
          notes: values.notes,
          amount: values.amount,
          paymentMethod: values.paymentMethod,
          transactionDate: values.date,
          cardId: values.cardId || null,
          installments: values.installments,
          recurrenceRuleId: recurrenceRuleId ?? null,
          originModule: existing?.originModule ?? "finance",
          originRefId: existing?.originRefId ?? null,
          lockedByOrigin: existing?.lockedByOrigin ?? false,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }, actorUserId, existing);

        if (existingIndex >= 0) {
          draft.transactions[existingIndex] = expense;
        } else {
          draft.transactions.unshift(expense);
        }

        removeInstallmentsForTransaction(draft, expense.id);
        if (expense.paymentMethod === "credit" && expense.cardId) {
          const card = draft.cards.find((item) => item.id === expense.cardId);
          if (card) {
            draft.installments.push(
              ...generateInstallmentsForTransaction({
                transaction: expense,
                card,
                workspaceId: draft.workspace.id,
                createdAt: now,
                actorUserId,
              }),
            );
          }
        }
      } else {
        const existingIndex = values.id ? draft.incomes.findIndex((item) => item.id === values.id) : -1;
        const existing = existingIndex >= 0 ? draft.incomes[existingIndex] : null;
        const income = applyAuditFields({
          id: values.id ?? createId("income"),
          workspaceId: draft.workspace.id,
          centerId: values.centerId,
          description: values.description,
          amount: values.amount,
          incomeType: values.incomeType,
          wallet: values.wallet,
          receivedAt: values.date,
          notes: values.notes,
          recurrenceRuleId: recurrenceRuleId ?? null,
          originModule: existing?.originModule ?? "finance",
          originRefId: existing?.originRefId ?? null,
          lockedByOrigin: existing?.lockedByOrigin ?? false,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }, actorUserId, existing);

        if (existingIndex >= 0) {
          draft.incomes[existingIndex] = income;
        } else {
          draft.incomes.unshift(income);
        }
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  deleteEntry(id, kind) {
    const next = updateSnapshot(get().snapshot, (draft) => {
      if (kind === "expense") {
        const existing = draft.transactions.find((item) => item.id === id);
        if (!existing || existing.lockedByOrigin) {
          return;
        }
        if (existing.recurrenceRuleId) {
          draft.recurrences = draft.recurrences.filter((rule) => rule.id !== existing.recurrenceRuleId);
        }
        draft.transactions = draft.transactions.filter((item) => item.id !== id);
        removeInstallmentsForTransaction(draft, id);
      } else {
        const existing = draft.incomes.find((item) => item.id === id);
        if (!existing || existing.lockedByOrigin) {
          return;
        }
        if (existing.recurrenceRuleId) {
          draft.recurrences = draft.recurrences.filter((rule) => rule.id !== existing.recurrenceRuleId);
        }
        draft.incomes = draft.incomes.filter((item) => item.id !== id);
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveCategory(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const existing = values.id ? draft.categories.find((item) => item.id === values.id) : null;
      const payload = applyAuditFields({
        id: values.id ?? createId("category"),
        workspaceId: draft.workspace.id,
        name: values.name,
        slug: slugify(values.name),
        color: values.color,
        icon: values.icon,
        keywords: values.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        budgetable: values.budgetable,
        system: false,
        scope: values.scope,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);
      const index = draft.categories.findIndex((item) => item.id === payload.id);

      if (index >= 0) {
        draft.categories[index] = { ...draft.categories[index], ...payload, createdAt: draft.categories[index].createdAt };
      } else {
        draft.categories.push(payload);
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  archiveCategory(id) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const category = draft.categories.find((item) => item.id === id);
      if (category) {
        category.archivedAt = new Date().toISOString();
        category.updatedAt = new Date().toISOString();
        category.updatedByUserId = actorUserId;
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveCard(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const existing = values.id ? draft.cards.find((item) => item.id === values.id) : null;
      const payload = applyAuditFields({
        id: values.id ?? createId("card"),
        workspaceId: draft.workspace.id,
        name: values.name,
        brand: values.brand,
        last4: values.last4,
        limit: values.limit,
        bestPurchaseDay: values.bestPurchaseDay,
        dueDay: values.dueDay,
        color: values.color,
        aliases: values.aliases.split(",").map((item) => item.trim()).filter(Boolean),
        active: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);
      const index = draft.cards.findIndex((item) => item.id === payload.id);

      if (index >= 0) {
        draft.cards[index] = { ...draft.cards[index], ...payload, createdAt: draft.cards[index].createdAt };
      } else {
        draft.cards.push(payload);
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  archiveCard(id) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const card = draft.cards.find((item) => item.id === id);
      if (card) {
        card.active = false;
        card.archivedAt = new Date().toISOString();
        card.updatedAt = new Date().toISOString();
        card.updatedByUserId = actorUserId;
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveBudget(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const existing = values.id ? draft.budgets.find((item) => item.id === values.id) : null;
      const payload = applyAuditFields({
        id: values.id ?? createId("budget"),
        workspaceId: draft.workspace.id,
        categoryId: values.categoryId,
        month: values.month,
        limit: values.limit,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);
      const index = draft.budgets.findIndex((item) => item.id === payload.id);
      if (index >= 0) {
        draft.budgets[index] = { ...draft.budgets[index], ...payload, createdAt: draft.budgets[index].createdAt };
      } else {
        draft.budgets.push(payload);
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  updateSettings(values) {
    const next = updateSnapshot(get().snapshot, (draft) => {
      draft.settings.salaryMonthly = values.salaryMonthly;
      draft.settings.vrMonthly = values.vrMonthly;
      draft.settings.salaryDay = values.salaryDay;
      draft.settings.vrDay = values.vrDay;
      draft.settings.theme = values.theme;
      draft.operationalSettings = { ...draft.operationalSettings, ...values.operationalSettings };
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  toggleCenterActive(centerId) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const center = draft.costCenters.find((item) => item.id === centerId);
      if (!center) {
        return;
      }

      center.active = !center.active;
      center.updatedAt = new Date().toISOString();
      center.updatedByUserId = actorUserId;
      draft.settings.activeCenterIds = draft.costCenters.filter((item) => item.active).map((item) => item.id);
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  toggleProfileActive(centerId) {
    get().toggleCenterActive(centerId);
  },
  saveVehicle(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "moto");
      const existing = values.id ? draft.vehicles.find((item) => item.id === values.id) : null;
      const payload = applyAuditFields({
        id: values.id ?? createId("vehicle"),
        workspaceId: draft.workspace.id,
        centerId,
        vehicleType: values.vehicleType,
        brand: values.brand.trim(),
        model: values.model.trim(),
        year: values.year,
        nickname: values.nickname.trim(),
        plate: values.plate?.trim() || null,
        fuelType: values.fuelType.trim(),
        currentOdometerKm: values.currentOdometerKm,
        averageCityKmPerLiter: values.averageCityKmPerLiter ?? null,
        averageHighwayKmPerLiter: values.averageHighwayKmPerLiter ?? null,
        tankCapacityLiters: values.tankCapacityLiters ?? null,
        monthlyDistanceGoalKm: values.monthlyDistanceGoalKm ?? null,
        fixedCosts: {
          ipva: {
            enabled: values.fixedCosts.ipva.enabled,
            amount: roundCurrency(values.fixedCosts.ipva.amount),
            dueMonth: values.fixedCosts.ipva.dueMonth,
            dueDay: values.fixedCosts.ipva.dueDay,
            notes: values.fixedCosts.ipva.notes?.trim() || null,
          },
          insurance: {
            enabled: values.fixedCosts.insurance.enabled,
            amount: roundCurrency(values.fixedCosts.insurance.amount),
            dueMonth: values.fixedCosts.insurance.dueMonth,
            dueDay: values.fixedCosts.insurance.dueDay,
            notes: values.fixedCosts.insurance.notes?.trim() || null,
          },
          licensing: {
            enabled: values.fixedCosts.licensing.enabled,
            amount: roundCurrency(values.fixedCosts.licensing.amount),
            dueMonth: values.fixedCosts.licensing.dueMonth,
            dueDay: values.fixedCosts.licensing.dueDay,
            notes: values.fixedCosts.licensing.notes?.trim() || null,
          },
        },
        notes: values.notes?.trim() || null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);
      const index = draft.vehicles.findIndex((item) => item.id === payload.id);
      if (index >= 0) {
        draft.vehicles[index] = { ...draft.vehicles[index], ...payload, createdAt: draft.vehicles[index].createdAt };
      } else {
        draft.vehicles.unshift(payload);
      }
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  deleteVehicle(id) {
    const current = get().snapshot;
    const next = updateSnapshot(current, (draft) => {
      if (draft.vehicles.length <= 1) {
        throw new Error("Mantenha pelo menos um veículo cadastrado.");
      }
      if (draft.fuelLogs.some((item) => item.vehicleId === id) || draft.maintenanceLogs.some((item) => item.vehicleId === id)) {
        throw new Error("Remova os abastecimentos e manutenções vinculados antes de excluir o veículo.");
      }
      draft.vehicles = draft.vehicles.filter((item) => item.id !== id);
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveFuelLog(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const resolved = solveFuelValues({
        totalCost: values.totalCost,
        liters: values.liters,
        pricePerLiter: values.pricePerLiter,
      });
      const centerId = getCenterIdByKind(draft, "moto");
      const logId = values.id ?? createId("fuel");
      const transactionId = upsertOriginExpense(draft, actorUserId, {
        originModule: "moto",
        originRefId: logId,
        centerId,
        categoryId: getCategoryIdBySlug(draft, "combustivel"),
        description: values.station ? `Abastecimento ${values.station}` : "Abastecimento",
        amount: resolved.totalCost,
        paymentMethod: values.paymentMethod,
        transactionDate: values.date,
      });
      const index = draft.fuelLogs.findIndex((item) => item.id === logId);
      const existing = index >= 0 ? draft.fuelLogs[index] : null;
      const payload = applyAuditFields({
        id: logId,
        workspaceId: draft.workspace.id,
        centerId,
        vehicleId: values.vehicleId,
        date: values.date,
        odometerKm: values.odometerKm,
        totalCost: resolved.totalCost,
        pricePerLiter: values.pricePerLiter,
        liters: resolved.liters,
        station: values.station || null,
        notes: values.notes || null,
        paymentMethod: values.paymentMethod,
        transactionId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);

      if (index >= 0) {
        draft.fuelLogs[index] = payload;
      } else {
        draft.fuelLogs.unshift(payload);
      }
      recalculateVehicleOdometer(draft, values.vehicleId, actorUserId);
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  deleteFuelLog(id) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const removed = draft.fuelLogs.find((item) => item.id === id);
      draft.fuelLogs = draft.fuelLogs.filter((item) => item.id !== id);
      removeOriginTransaction(draft, "moto", id);
      if (removed) {
        recalculateVehicleOdometer(draft, removed.vehicleId, actorUserId);
      }
    });
    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveMaintenanceLog(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "moto");
      const logId = values.id ?? createId("maint");
      const transactionId = upsertOriginExpense(draft, actorUserId, {
        originModule: "moto",
        originRefId: logId,
        centerId,
        categoryId: getCategoryIdBySlug(draft, "manutencao-moto"),
        description: values.description,
        amount: values.totalCost,
        paymentMethod: values.paymentMethod,
        transactionDate: values.date,
      });
      const index = draft.maintenanceLogs.findIndex((item) => item.id === logId);
      const existing = index >= 0 ? draft.maintenanceLogs[index] : null;
      const payload = applyAuditFields({
        id: logId,
        workspaceId: draft.workspace.id,
        centerId,
        vehicleId: values.vehicleId,
        date: values.date,
        odometerKm: values.odometerKm,
        type: values.type,
        category: values.category,
        description: values.description,
        totalCost: values.totalCost,
        shop: values.shop || null,
        notes: values.notes || null,
        recurringMonths: values.recurringMonths || null,
        recurringKm: values.recurringKm || null,
        paymentMethod: values.paymentMethod,
        transactionId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);

      if (index >= 0) {
        draft.maintenanceLogs[index] = payload;
      } else {
        draft.maintenanceLogs.unshift(payload);
      }
      recalculateVehicleOdometer(draft, values.vehicleId, actorUserId);
    });
    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  deleteMaintenanceLog(id) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const removed = draft.maintenanceLogs.find((item) => item.id === id);
      draft.maintenanceLogs = draft.maintenanceLogs.filter((item) => item.id !== id);
      removeOriginTransaction(draft, "moto", id);
      if (removed) {
        recalculateVehicleOdometer(draft, removed.vehicleId, actorUserId);
      }
    });
    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveFilamentPurchase(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "store");
      const batchId = createId("stock_batch_filament");
      const split = splitGroupedFilamentPurchase({
        totalCost: values.totalCost,
        totalWeightGrams: values.totalWeightGrams,
        spoolCount: values.spoolCount,
      });

      Array.from({ length: Math.max(1, values.spoolCount) }, (_, index) => {
        const spoolId = createId("spool");
        const spoolName = `${values.material} ${values.color}${values.spoolCount > 1 ? ` #${index + 1}` : ""}`;
        draft.filamentSpools.unshift(applyAuditFields({
          id: spoolId,
          workspaceId: draft.workspace.id,
          centerId,
          name: spoolName,
          material: values.material,
          color: values.color,
          brand: values.brand,
          nominalWeightGrams: split.nominalWeightGrams,
          remainingWeightGrams: split.nominalWeightGrams,
          purchaseCost: split.purchaseCost,
          costPerGram: split.costPerGram,
          purchaseDate: values.purchaseDate,
          supplier: values.supplier || null,
          lot: null,
          notes: values.notes || null,
          createdAt: now,
          updatedAt: now,
        }, actorUserId));
        draft.stockMovements.unshift(applyAuditFields({
          id: createId("move"),
          workspaceId: draft.workspace.id,
          centerId,
          itemKind: "filament",
          itemId: spoolId,
          itemName: spoolName,
          itemCategory: `${values.material} • ${values.color}`,
          movementKind: "purchase",
          quantity: split.nominalWeightGrams,
          unitCost: split.costPerGram,
          totalCost: split.purchaseCost,
          occurredAt: values.purchaseDate,
          notes: `Compra agrupada ${batchId}`,
          createdAt: now,
          updatedAt: now,
        }, actorUserId));
      });

      upsertOriginExpense(draft, actorUserId, {
        originModule: "store",
        originRefId: batchId,
        centerId,
        categoryId: getCategoryIdBySlug(draft, "filamento"),
        description: `Compra de ${values.spoolCount} rolo(s) de filamento`,
        amount: values.totalCost,
        paymentMethod: "pix",
        transactionDate: values.purchaseDate,
      });
    });
    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveSupplyItem(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "store");
      const unitCost = roundCurrency(values.totalCost / values.totalQuantity);
      const itemId = values.id ?? createId("supply");
      const index = draft.supplyItems.findIndex((item) => item.id === itemId);
      const existing = index >= 0 ? draft.supplyItems[index] : null;
      const payload = applyAuditFields({
        id: itemId,
        workspaceId: draft.workspace.id,
        centerId,
        name: values.name,
        category: values.category,
        unit: values.unit,
        totalQuantity: values.totalQuantity,
        remainingQuantity:
          index >= 0
            ? Math.min(draft.supplyItems[index].remainingQuantity, values.totalQuantity)
            : values.totalQuantity,
        totalCost: values.totalCost,
        unitCost,
        purchaseDate: values.purchaseDate,
        notes: values.notes || null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing);

      if (index >= 0) {
        draft.supplyItems[index] = payload;
      } else {
        draft.supplyItems.unshift(payload);
        draft.stockMovements.unshift(applyAuditFields({
          id: createId("move"),
          workspaceId: draft.workspace.id,
          centerId,
          itemKind: "supply",
          itemId,
          itemName: values.name,
          itemCategory: values.category,
          movementKind: "purchase",
          quantity: values.totalQuantity,
          unitCost,
          totalCost: values.totalCost,
          occurredAt: values.purchaseDate,
          notes: values.notes || null,
          createdAt: now,
          updatedAt: now,
        }, actorUserId));
      }

      upsertOriginExpense(draft, actorUserId, {
        originModule: "store",
        originRefId: `supply_purchase_${itemId}`,
        centerId,
        categoryId: getCategoryIdBySlug(draft, values.category.toLowerCase().includes("embal") ? "embalagem" : "pintura-e-acabamento"),
        description: `Compra de ${values.name}`,
        amount: values.totalCost,
        paymentMethod: "pix",
        transactionDate: values.purchaseDate,
      });
    });
    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveStockAdjustment(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "store");
      if (values.quantityDelta === 0) {
        throw new Error("Informe um ajuste diferente de zero.");
      }

      if (values.itemKind === "filament") {
        const spool = draft.filamentSpools.find((item) => item.id === values.itemId);
        if (!spool) {
          throw new Error("Filamento não encontrado.");
        }

        const nextRemaining = roundCurrency(spool.remainingWeightGrams + values.quantityDelta);
        if (nextRemaining < 0) {
          throw new Error(`O ajuste deixaria ${spool.name} com estoque negativo.`);
        }

        spool.remainingWeightGrams = nextRemaining;
        spool.updatedAt = now;
        spool.updatedByUserId = actorUserId;

        draft.stockMovements.unshift(applyAuditFields({
          id: createId("move"),
          workspaceId: draft.workspace.id,
          centerId,
          itemKind: "filament",
          itemId: spool.id,
          itemName: spool.name,
          itemCategory: `${spool.material} • ${spool.color}`,
          movementKind: "adjustment",
          quantity: roundCurrency(values.quantityDelta),
          unitCost: spool.costPerGram,
          totalCost: roundCurrency(values.quantityDelta * spool.costPerGram),
          occurredAt: values.occurredAt,
          notes: values.notes || null,
          createdAt: now,
          updatedAt: now,
        }, actorUserId));

        return;
      }

      const supply = draft.supplyItems.find((item) => item.id === values.itemId);
      if (!supply) {
        throw new Error("Insumo não encontrado.");
      }

      const nextRemaining = roundCurrency(supply.remainingQuantity + values.quantityDelta);
      if (nextRemaining < 0) {
        throw new Error(`O ajuste deixaria ${supply.name} com estoque negativo.`);
      }

      supply.remainingQuantity = nextRemaining;
      supply.updatedAt = now;
      supply.updatedByUserId = actorUserId;

      draft.stockMovements.unshift(applyAuditFields({
        id: createId("move"),
        workspaceId: draft.workspace.id,
        centerId,
        itemKind: "supply",
        itemId: supply.id,
        itemName: supply.name,
        itemCategory: supply.category,
        movementKind: "adjustment",
        quantity: roundCurrency(values.quantityDelta),
        unitCost: supply.unitCost,
        totalCost: roundCurrency(values.quantityDelta * supply.unitCost),
        occurredAt: values.occurredAt,
        notes: values.notes || null,
        createdAt: now,
        updatedAt: now,
      }, actorUserId));
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveProductionJob(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "store");
      const jobId = values.id ?? createId("production");
      const existing = draft.productionJobs.find((item) => item.id === jobId);
      if (existing) {
        restoreProductionInventory(draft, jobId, actorUserId);
      }

      const usages = values.materials.map((material) => {
        if (material.itemKind === "filament") {
          const spool = draft.filamentSpools.find((item) => item.id === material.itemId);
          if (!spool) {
            throw new Error("Filamento não encontrado.");
          }
          const totalToConsume = material.quantity + (material.wasteQuantity ?? 0);
          if (spool.remainingWeightGrams < totalToConsume) {
            throw new Error(`Estoque insuficiente para ${spool.name}.`);
          }
          spool.remainingWeightGrams = roundCurrency(spool.remainingWeightGrams - totalToConsume);
          spool.updatedAt = now;
          spool.updatedByUserId = actorUserId;
          return applyAuditFields({
            id: createId("usage"),
            workspaceId: draft.workspace.id,
            productionJobId: jobId,
            itemKind: "filament" as const,
            itemId: spool.id,
            itemName: spool.name,
            itemCategory: `${spool.material} • ${spool.color}`,
            quantity: material.quantity,
            wasteQuantity: material.wasteQuantity ?? 0,
            unitCost: getItemUnitCost(spool),
            totalCost: roundCurrency(totalToConsume * getItemUnitCost(spool)),
            createdAt: now,
            updatedAt: now,
          }, actorUserId);
        }

        const supply = draft.supplyItems.find((item) => item.id === material.itemId);
        if (!supply) {
          throw new Error("Insumo não encontrado.");
        }
        const totalToConsume = material.quantity + (material.wasteQuantity ?? 0);
        if (supply.remainingQuantity < totalToConsume) {
          throw new Error(`Estoque insuficiente para ${supply.name}.`);
        }
        supply.remainingQuantity = roundCurrency(supply.remainingQuantity - totalToConsume);
        supply.updatedAt = now;
        supply.updatedByUserId = actorUserId;
        return applyAuditFields({
          id: createId("usage"),
          workspaceId: draft.workspace.id,
          productionJobId: jobId,
          itemKind: "supply" as const,
          itemId: supply.id,
          itemName: supply.name,
          itemCategory: supply.category,
          quantity: material.quantity,
          wasteQuantity: material.wasteQuantity ?? 0,
          unitCost: getItemUnitCost(supply),
          totalCost: roundCurrency(totalToConsume * getItemUnitCost(supply)),
          createdAt: now,
          updatedAt: now,
        }, actorUserId);
      });

      usages.forEach((usage) => {
        const baseMovement = {
          workspaceId: draft.workspace.id,
          centerId,
          itemKind: usage.itemKind,
          itemId: usage.itemId,
          itemName: usage.itemName,
          itemCategory: usage.itemCategory ?? null,
          occurredAt: values.date,
          relatedProductionJobId: jobId,
          createdAt: now,
          updatedAt: now,
        };

        if (usage.quantity > 0) {
          draft.stockMovements.unshift(applyAuditFields({
            id: createId("move"),
            ...baseMovement,
            movementKind: "consume",
            quantity: usage.quantity,
            unitCost: usage.unitCost,
            totalCost: roundCurrency(usage.quantity * usage.unitCost),
            notes: values.name,
          }, actorUserId));
        }

        if (usage.wasteQuantity > 0) {
          draft.stockMovements.unshift(applyAuditFields({
            id: createId("move"),
            ...baseMovement,
            movementKind: "waste",
            quantity: usage.wasteQuantity,
            unitCost: usage.unitCost,
            totalCost: roundCurrency(usage.wasteQuantity * usage.unitCost),
            notes: values.name,
          }, actorUserId));
        }
      });

      draft.productionMaterialUsages = draft.productionMaterialUsages.filter((usage) => usage.productionJobId !== jobId);
      draft.productionMaterialUsages.push(...usages);

      const metrics = calculateProductionMetrics({
        quantityProduced: values.quantityProduced,
        quantitySold: values.quantitySold,
        printHours: values.printHours,
        finishingHours: values.finishingHours,
        additionalManualCost: values.additionalManualCost,
        packagingCost: values.packagingCost,
        salePriceTotal: values.salePriceTotal,
        settings: draft.operationalSettings,
        usages,
      });

      draft.productionJobs = draft.productionJobs.filter((item) => item.id !== jobId);
      draft.productionJobs.unshift(applyAuditFields({
        id: jobId,
        workspaceId: draft.workspace.id,
        centerId,
        name: values.name,
        client: values.client || null,
        date: values.date,
        quantityProduced: values.quantityProduced,
        quantitySold: values.quantitySold,
        status: values.status,
        printHours: values.printHours,
        finishingHours: values.finishingHours,
        additionalManualCost: values.additionalManualCost,
        packagingCost: values.packagingCost,
        salePriceUnit: values.salePriceUnit,
        salePriceTotal: values.salePriceTotal,
        notes: values.notes || null,
        energyCost: metrics.energyCost,
        materialCost: metrics.materialCost,
        wasteCost: metrics.wasteCost,
        supplyCost: metrics.supplyCost,
        paintCost: metrics.paintCost,
        otherSupplyCost: metrics.otherSupplyCost,
        finishingCost: metrics.finishingCost,
        fixedCostApplied: metrics.fixedCostApplied,
        totalCost: metrics.totalCost,
        unitCost: metrics.unitCost,
        grossProfit: metrics.grossProfit,
        marginPercent: metrics.marginPercent,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing));
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  deleteProductionJob(id) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const existing = draft.productionJobs.find((item) => item.id === id);
      if (!existing) {
        return;
      }

      restoreProductionInventory(draft, id, actorUserId);
      draft.productionJobs = draft.productionJobs.filter((item) => item.id !== id);
      draft.storeOrders = draft.storeOrders.map((order) =>
        order.linkedProductionJobId === id
          ? {
              ...order,
              linkedProductionJobId: null,
              updatedAt: new Date().toISOString(),
              updatedByUserId: actorUserId,
            }
          : order,
      );
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  saveStoreOrder(values) {
    const current = get().snapshot;
    const actorUserId = current ? resolveActorUserId(current, get().activeUserId) : null;
    const next = updateSnapshot(current, (draft) => {
      const now = new Date().toISOString();
      const centerId = getCenterIdByKind(draft, "store");
      const orderId = values.id ?? createId("order");
      const linkedJob = values.linkedProductionJobId ? draft.productionJobs.find((item) => item.id === values.linkedProductionJobId) : null;
      const totalPrice = roundCurrency(values.totalPrice || values.unitPrice * values.quantity);
      const totalCostSnapshot = roundCurrency((linkedJob?.unitCost ?? 0) * values.quantity);
      const grossProfit = roundCurrency(totalPrice - totalCostSnapshot);
      const existing = draft.storeOrders.find((item) => item.id === orderId);
      const incomeId =
        values.status === "delivered"
          ? upsertOriginIncome(draft, actorUserId, {
              originRefId: orderId,
              centerId,
              description: `Pedido entregue - ${values.productName}`,
              amount: totalPrice,
              receivedAt: values.date,
            })
          : null;

      if (values.status !== "delivered") {
        removeOriginIncome(draft, orderId);
      }

      draft.storeOrders = draft.storeOrders.filter((item) => item.id !== orderId);
      draft.storeOrders.unshift(applyAuditFields({
        id: orderId,
        workspaceId: draft.workspace.id,
        centerId,
        client: values.client || null,
        productName: values.productName,
        quantity: values.quantity,
        date: values.date,
        status: values.status,
        unitPrice: values.unitPrice,
        totalPrice,
        totalCostSnapshot,
        grossProfit,
        notes: values.notes || null,
        linkedProductionJobId: values.linkedProductionJobId || null,
        incomeId: incomeId ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }, actorUserId, existing));
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  deleteStoreOrder(id) {
    const current = get().snapshot;
    const next = updateSnapshot(current, (draft) => {
      draft.storeOrders = draft.storeOrders.filter((item) => item.id !== id);
      removeOriginIncome(draft, id);
    });

    if (next) {
      set({ snapshot: next });
      void get().persistNow();
    }
  },
  importSnapshot(snapshot) {
    const parsed = withStorageMode(parseWorkspaceSnapshot(snapshot), get().runtimeConfig);
    const next = cloneSnapshot(parsed);
    next.meta.dirty = true;
    next.meta.updatedAt = new Date().toISOString();
    set({ snapshot: next });
    void get().persistNow();
  },
  resetWorkspace() {
    const runtimeConfig = get().runtimeConfig;
    const currentSnapshot = get().snapshot;
    const snapshot =
      runtimeConfig.storageMode === "supabase" && currentSnapshot
        ? createSeedSnapshot({
            storageMode: runtimeConfig.storageMode,
            workspaceId: currentSnapshot.workspace.id,
            workspaceName: currentSnapshot.workspace.name,
            userId: currentSnapshot.user.id,
            username: currentSnapshot.user.username,
            displayName: currentSnapshot.user.displayName,
            email: currentSnapshot.user.email,
          })
        : createSeedSnapshot(runtimeConfig.storageMode);
    set({
      snapshot,
      selectedMonth: formatMonthKey(new Date()),
      syncStatus: runtimeConfig.storageMode === "supabase" ? "syncing" : "local",
    });
    void get().persistNow();
  },
}));
