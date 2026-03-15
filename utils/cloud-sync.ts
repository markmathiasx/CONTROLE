import { createSeedSnapshot } from "@/utils/seed";
import { slugify } from "@/lib/utils";
import type {
  CreditCard,
  FuelLog,
  Income,
  MaintenanceLog,
  RuntimeConfig,
  SupplyItem,
  Transaction,
  User,
  Vehicle,
  WorkspaceSnapshot,
} from "@/types/domain";

type RebaseContext = {
  workspaceId: string;
  workspaceName: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
  storageMode: RuntimeConfig["storageMode"];
  migrationOrigin?: string;
};

type MergeResult<T extends { id: string; createdAt: string; updatedAt: string }> = {
  items: T[];
  idMap: Map<string, string>;
};

function cloneSnapshot(snapshot: WorkspaceSnapshot) {
  return structuredClone(snapshot);
}

function getNow() {
  return new Date().toISOString();
}

function isIncomingNewer(currentUpdatedAt: string, incomingUpdatedAt: string) {
  return new Date(incomingUpdatedAt).getTime() > new Date(currentUpdatedAt).getTime();
}

function withAudit<T extends { createdByUserId?: string | null; updatedByUserId?: string | null }>(
  item: T,
  userId: string,
) {
  return {
    ...item,
    createdByUserId: item.createdByUserId ?? userId,
    updatedByUserId: userId,
  };
}

function remapValue(value: string | null | undefined, idMap: Map<string, string>) {
  if (!value) {
    return value ?? null;
  }

  return idMap.get(value) ?? value;
}

function mergeCollection<T extends { id: string; createdAt: string; updatedAt: string }>(
  baseItems: T[],
  incomingItems: T[],
  getSemanticKey: (item: T) => string,
): MergeResult<T> {
  const items = [...baseItems];
  const idMap = new Map<string, string>();
  const byId = new Map(items.map((item, index) => [item.id, { item, index }]));
  const byKey = new Map(items.map((item, index) => [getSemanticKey(item), { item, index }]));

  incomingItems.forEach((incoming) => {
    const existingById = byId.get(incoming.id);
    if (existingById) {
      idMap.set(incoming.id, existingById.item.id);
      if (isIncomingNewer(existingById.item.updatedAt, incoming.updatedAt)) {
        items[existingById.index] = { ...existingById.item, ...incoming, id: existingById.item.id };
        byId.set(existingById.item.id, { item: items[existingById.index], index: existingById.index });
        byKey.set(getSemanticKey(items[existingById.index]), { item: items[existingById.index], index: existingById.index });
      }
      return;
    }

    const semanticKey = getSemanticKey(incoming);
    const existingByKey = byKey.get(semanticKey);
    if (existingByKey) {
      idMap.set(incoming.id, existingByKey.item.id);
      if (isIncomingNewer(existingByKey.item.updatedAt, incoming.updatedAt)) {
        items[existingByKey.index] = {
          ...existingByKey.item,
          ...incoming,
          id: existingByKey.item.id,
          createdAt: existingByKey.item.createdAt,
        };
        byId.set(existingByKey.item.id, { item: items[existingByKey.index], index: existingByKey.index });
        byKey.set(semanticKey, { item: items[existingByKey.index], index: existingByKey.index });
      }
      return;
    }

    items.push(incoming);
    const nextIndex = items.length - 1;
    idMap.set(incoming.id, incoming.id);
    byId.set(incoming.id, { item: incoming, index: nextIndex });
    byKey.set(semanticKey, { item: incoming, index: nextIndex });
  });

  return { items, idMap };
}

function createSnapshotUser(context: RebaseContext, existing?: User): User {
  const now = getNow();
  return {
    id: context.userId,
    username: context.username,
    displayName: context.displayName,
    email: context.email,
    avatarUrl: existing?.avatarUrl ?? null,
    role: existing?.role ?? "owner",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdByUserId: existing?.createdByUserId ?? context.userId,
    updatedByUserId: context.userId,
  };
}

export function hasAnonymousLocalChanges(snapshot: WorkspaceSnapshot | null) {
  if (!snapshot) {
    return false;
  }

  return snapshot.meta.dirty || snapshot.meta.source !== "seed";
}

export function createCloudSeedSnapshot(context: RebaseContext) {
  return createSeedSnapshot({
    storageMode: context.storageMode,
    workspaceId: context.workspaceId,
    workspaceName: context.workspaceName,
    userId: context.userId,
    username: context.username,
    displayName: context.displayName,
    email: context.email,
  });
}

export function pickPreferredWorkspaceSnapshot(
  remoteSnapshot: WorkspaceSnapshot | null,
  cachedWorkspaceSnapshot: WorkspaceSnapshot | null,
) {
  if (!remoteSnapshot) {
    return cachedWorkspaceSnapshot;
  }

  if (!cachedWorkspaceSnapshot) {
    return remoteSnapshot;
  }

  if (cachedWorkspaceSnapshot.meta.dirty) {
    return cachedWorkspaceSnapshot;
  }

  const remoteUpdatedAt = new Date(remoteSnapshot.meta.updatedAt).getTime();
  const cachedUpdatedAt = new Date(cachedWorkspaceSnapshot.meta.updatedAt).getTime();

  if (cachedUpdatedAt > remoteUpdatedAt) {
    return cachedWorkspaceSnapshot;
  }

  if (cachedUpdatedAt === remoteUpdatedAt && cachedWorkspaceSnapshot.version > remoteSnapshot.version) {
    return cachedWorkspaceSnapshot;
  }

  return remoteSnapshot;
}

export function rebaseSnapshotForWorkspace(snapshot: WorkspaceSnapshot, context: RebaseContext) {
  const next = cloneSnapshot(snapshot);
  const now = getNow();
  const previousWorkspaceId = next.workspace.id;
  const previousUserId = next.user.id;

  const patchWorkspaceId = <T extends { workspaceId: string }>(items: T[]) =>
    items.map((item) => ({ ...item, workspaceId: context.workspaceId }));

  next.user = createSnapshotUser(context, next.user);
  next.workspace = {
    ...next.workspace,
    id: context.workspaceId,
    name: context.workspaceName,
    slug: slugify(context.workspaceName),
    ownerUserId: context.userId,
    updatedAt: now,
    updatedByUserId: context.userId,
    createdByUserId: next.workspace.createdByUserId ?? context.userId,
  };
  next.costCenters = patchWorkspaceId(next.costCenters).map((item) => withAudit(item, context.userId));
  next.categories = patchWorkspaceId(next.categories).map((item) => withAudit(item, context.userId));
  next.cards = patchWorkspaceId(next.cards).map((item) => withAudit(item, context.userId));
  next.transactions = patchWorkspaceId(next.transactions).map((item) => ({
    ...withAudit(item, context.userId),
    createdByUserId: item.createdByUserId === previousUserId || !item.createdByUserId ? context.userId : item.createdByUserId,
  }));
  next.installments = patchWorkspaceId(next.installments).map((item) => withAudit(item, context.userId));
  next.incomes = patchWorkspaceId(next.incomes).map((item) => ({
    ...withAudit(item, context.userId),
    createdByUserId: item.createdByUserId === previousUserId || !item.createdByUserId ? context.userId : item.createdByUserId,
  }));
  next.budgets = patchWorkspaceId(next.budgets).map((item) => withAudit(item, context.userId));
  next.recurrences = patchWorkspaceId(next.recurrences).map((item) => withAudit(item, context.userId));
  next.vehicles = patchWorkspaceId(next.vehicles).map((item) => withAudit(item, context.userId));
  next.fuelLogs = patchWorkspaceId(next.fuelLogs).map((item) => withAudit(item, context.userId));
  next.maintenanceLogs = patchWorkspaceId(next.maintenanceLogs).map((item) => withAudit(item, context.userId));
  next.filamentSpools = patchWorkspaceId(next.filamentSpools).map((item) => withAudit(item, context.userId));
  next.supplyItems = patchWorkspaceId(next.supplyItems).map((item) => withAudit(item, context.userId));
  next.stockMovements = patchWorkspaceId(next.stockMovements).map((item) => withAudit(item, context.userId));
  next.productionJobs = patchWorkspaceId(next.productionJobs).map((item) => withAudit(item, context.userId));
  next.productionMaterialUsages = patchWorkspaceId(next.productionMaterialUsages).map((item) => withAudit(item, context.userId));
  next.storeOrders = patchWorkspaceId(next.storeOrders).map((item) => withAudit(item, context.userId));
  next.settings.storageMode = context.storageMode;
  next.meta.storageMode = context.storageMode;
  next.meta.importedFromLocalAt = now;
  next.meta.lastMergedAt = now;
  next.meta.migrationOrigin = context.migrationOrigin ?? "local-first-login";
  next.meta.source = "local";
  next.meta.updatedAt = now;
  next.meta.dirty = true;

  if (previousWorkspaceId !== context.workspaceId || previousUserId !== context.userId) {
    next.version += 1;
  }

  return next;
}

function transactionSemanticKey(item: Transaction) {
  return item.originRefId && item.lockedByOrigin
    ? `${item.originModule}:${item.originRefId}`
    : `${item.transactionDate}:${item.amount}:${item.description}:${item.centerId}:${item.paymentMethod}`;
}

function incomeSemanticKey(item: Income) {
  return item.originRefId
    ? `${item.originModule}:${item.originRefId}`
    : `${item.receivedAt}:${item.amount}:${item.description}:${item.centerId}:${item.incomeType}`;
}

function vehicleKey(item: Vehicle) {
  return `${item.brand}:${item.model}:${item.year}:${item.nickname}`;
}

function cardKey(item: CreditCard) {
  return `${item.name}:${item.last4}`;
}

function fuelKey(item: FuelLog) {
  return `${item.vehicleId}:${item.date}:${item.odometerKm}:${item.totalCost}`;
}

function maintenanceKey(item: MaintenanceLog) {
  return `${item.vehicleId}:${item.date}:${item.category}:${item.totalCost}`;
}

function supplyKey(item: SupplyItem) {
  return `${item.name}:${item.category}:${item.purchaseDate}:${item.totalCost}`;
}

export function mergeWorkspaceSnapshots(baseSnapshot: WorkspaceSnapshot, incomingSnapshot: WorkspaceSnapshot) {
  const base = cloneSnapshot(baseSnapshot);
  const incoming = cloneSnapshot(incomingSnapshot);
  const now = getNow();

  const centersMerged = mergeCollection(base.costCenters, incoming.costCenters, (item) => item.kind);
  base.costCenters = centersMerged.items;

  const categoriesMerged = mergeCollection(base.categories, incoming.categories, (item) => item.slug);
  base.categories = categoriesMerged.items;

  const cardsMerged = mergeCollection(base.cards, incoming.cards, cardKey);
  base.cards = cardsMerged.items;

  const vehiclesMerged = mergeCollection(base.vehicles, incoming.vehicles, vehicleKey);
  base.vehicles = vehiclesMerged.items;

  const filamentMerged = mergeCollection(
    base.filamentSpools,
    incoming.filamentSpools,
    (item) => `${item.name}:${item.material}:${item.color}:${item.purchaseDate}:${item.purchaseCost}`,
  );
  base.filamentSpools = filamentMerged.items;

  const supplyMerged = mergeCollection(base.supplyItems, incoming.supplyItems, supplyKey);
  base.supplyItems = supplyMerged.items;

  const normalizedTransactions = incoming.transactions.map((item) => ({
    ...item,
    centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
    categoryId: remapValue(item.categoryId, categoriesMerged.idMap) ?? item.categoryId,
    cardId: remapValue(item.cardId, cardsMerged.idMap),
  }));
  const transactionsMerged = mergeCollection(base.transactions, normalizedTransactions, transactionSemanticKey);
  base.transactions = transactionsMerged.items;

  const normalizedIncomes = incoming.incomes.map((item) => ({
    ...item,
    centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
  }));
  const incomesMerged = mergeCollection(base.incomes, normalizedIncomes, incomeSemanticKey);
  base.incomes = incomesMerged.items;

  base.budgets = mergeCollection(
    base.budgets,
    incoming.budgets.map((item) => ({
      ...item,
      categoryId: remapValue(item.categoryId, categoriesMerged.idMap) ?? item.categoryId,
    })),
    (item) => `${item.categoryId}:${item.month}`,
  ).items;

  base.recurrences = mergeCollection(
    base.recurrences,
    incoming.recurrences.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
      categoryId: remapValue(item.categoryId, categoriesMerged.idMap),
      cardId: remapValue(item.cardId, cardsMerged.idMap),
    })),
    (item) => `${item.description}:${item.amount}:${item.frequency}:${item.startDate}`,
  ).items;

  base.installments = mergeCollection(
    base.installments,
    incoming.installments.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
      categoryId: remapValue(item.categoryId, categoriesMerged.idMap) ?? item.categoryId,
      cardId: remapValue(item.cardId, cardsMerged.idMap) ?? item.cardId,
      transactionId: remapValue(item.transactionId, transactionsMerged.idMap) ?? item.transactionId,
    })),
    (item) => `${item.transactionId}:${item.installmentNumber}`,
  ).items;

  base.fuelLogs = mergeCollection(
    base.fuelLogs,
    incoming.fuelLogs.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
      vehicleId: remapValue(item.vehicleId, vehiclesMerged.idMap) ?? item.vehicleId,
      transactionId: remapValue(item.transactionId, transactionsMerged.idMap),
    })),
    fuelKey,
  ).items;

  base.maintenanceLogs = mergeCollection(
    base.maintenanceLogs,
    incoming.maintenanceLogs.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
      vehicleId: remapValue(item.vehicleId, vehiclesMerged.idMap) ?? item.vehicleId,
      transactionId: remapValue(item.transactionId, transactionsMerged.idMap),
    })),
    maintenanceKey,
  ).items;

  const productionMerged = mergeCollection(
    base.productionJobs,
    incoming.productionJobs.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
    })),
    (item) => `${item.name}:${item.date}:${item.quantityProduced}`,
  );
  base.productionJobs = productionMerged.items;

  base.stockMovements = mergeCollection(
    base.stockMovements,
    incoming.stockMovements.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
      itemId:
        item.itemKind === "filament"
          ? remapValue(item.itemId, filamentMerged.idMap) ?? item.itemId
          : remapValue(item.itemId, supplyMerged.idMap) ?? item.itemId,
      relatedProductionJobId: remapValue(item.relatedProductionJobId, productionMerged.idMap),
    })),
    (item) => `${item.movementKind}:${item.itemKind}:${item.itemId}:${item.occurredAt}:${item.totalCost}:${item.relatedProductionJobId ?? ""}`,
  ).items;

  base.productionMaterialUsages = mergeCollection(
    base.productionMaterialUsages,
    incoming.productionMaterialUsages.map((item) => ({
      ...item,
      productionJobId: remapValue(item.productionJobId, productionMerged.idMap) ?? item.productionJobId,
      itemId:
        item.itemKind === "filament"
          ? remapValue(item.itemId, filamentMerged.idMap) ?? item.itemId
          : remapValue(item.itemId, supplyMerged.idMap) ?? item.itemId,
    })),
    (item) => `${item.productionJobId}:${item.itemKind}:${item.itemId}`,
  ).items;

  const ordersMerged = mergeCollection(
    base.storeOrders,
    incoming.storeOrders.map((item) => ({
      ...item,
      centerId: remapValue(item.centerId, centersMerged.idMap) ?? item.centerId,
      linkedProductionJobId: remapValue(item.linkedProductionJobId, productionMerged.idMap),
      incomeId: remapValue(item.incomeId, incomesMerged.idMap),
    })),
    (item) => `${item.productName}:${item.date}:${item.quantity}:${item.totalPrice}`,
  );
  base.storeOrders = ordersMerged.items;

  base.settings = {
    ...base.settings,
    ...incoming.settings,
    activeCenterIds: Array.from(new Set([...base.settings.activeCenterIds, ...incoming.settings.activeCenterIds.map((id) => remapValue(id, centersMerged.idMap) ?? id)])),
    storageMode: incoming.settings.storageMode,
  };
  base.operationalSettings = { ...base.operationalSettings, ...incoming.operationalSettings };
  base.user = incoming.user;
  base.workspace = { ...base.workspace, ...incoming.workspace, id: base.workspace.id };
  base.meta = {
    ...base.meta,
    ...incoming.meta,
    updatedAt: now,
    lastMergedAt: now,
    lastMergedHash: `${incoming.version}:${incoming.meta.updatedAt}`,
    dirty: true,
    source: "local",
    importedFromLocalAt: incoming.meta.importedFromLocalAt ?? now,
    migrationOrigin: incoming.meta.migrationOrigin ?? "local-first-login",
  };
  base.version = Math.max(base.version, incoming.version) + 1;

  return base;
}
