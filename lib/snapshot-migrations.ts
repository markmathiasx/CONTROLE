import { appVersion, schemaVersion } from "@/lib/constants";
import { workspaceSnapshotSchema } from "@/lib/schemas";
import { slugify } from "@/lib/utils";
import type {
  CategoryScope,
  CostCenter,
  CostCenterKind,
  RuntimeConfig,
  User,
  WorkspaceSnapshot,
} from "@/types/domain";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asArray<T = UnknownRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function inferCategoryScope(slugOrName: string): CategoryScope {
  const normalized = slugOrName.toLowerCase();

  if (
    ["combustivel", "combustível", "manutencao-moto", "manutenção moto", "documentacao-moto"].some(
      (item) => normalized.includes(item),
    )
  ) {
    return "moto";
  }

  if (
    ["filamento", "pintura", "acabamento", "energia-loja", "embalagem", "venda-loja"].some(
      (item) => normalized.includes(item),
    )
  ) {
    return "store";
  }

  if (["mercado", "contas", "aluguel", "assinatura", "pets", "outros"].includes(normalized)) {
    return "shared";
  }

  return "finance";
}

function getCenterModule(kind: CostCenterKind) {
  if (kind === "moto") {
    return "moto" as const;
  }

  if (kind === "store") {
    return "store" as const;
  }

  if (kind === "shared") {
    return "shared" as const;
  }

  return "finance" as const;
}

function makeCostCenter(
  workspaceId: string,
  kind: CostCenterKind,
  now: string,
): CostCenter {
  const baseByKind: Record<
    CostCenterKind,
    Pick<CostCenter, "id" | "name" | "color" | "icon" | "active">
  > = {
    me: {
      id: "profile_me",
      name: "Eu",
      color: "#10b981",
      icon: "wallet",
      active: true,
    },
    partner: {
      id: "profile_partner",
      name: "Namorada",
      color: "#06b6d4",
      icon: "heart-handshake",
      active: true,
    },
    shared: {
      id: "profile_shared",
      name: "Casal",
      color: "#8b5cf6",
      icon: "home",
      active: true,
    },
    moto: {
      id: "center_moto",
      name: "Moto",
      color: "#f59e0b",
      icon: "bike",
      active: true,
    },
    store: {
      id: "center_store",
      name: "Loja",
      color: "#22c55e",
      icon: "printer",
      active: true,
    },
  };

  const base = baseByKind[kind];

  return {
    workspaceId,
    kind,
    module: getCenterModule(kind),
    createdAt: now,
    updatedAt: now,
    ...base,
  };
}

function normalizeUser(rawUser: unknown, now: string): User {
  const source = isRecord(rawUser) ? rawUser : {};
  const displayName =
    typeof source.displayName === "string" && source.displayName
      ? source.displayName
      : typeof source.name === "string" && source.name
        ? source.name
        : "Usuário";
  const username =
    typeof source.username === "string" && source.username
      ? source.username
      : slugify(displayName || "usuario");

  return {
    id: typeof source.id === "string" && source.id ? source.id : "user_owner",
    username,
    displayName,
    email:
      typeof source.email === "string" && source.email
        ? source.email
        : `${username || "usuario"}@local.app`,
    avatarUrl:
      typeof source.avatarUrl === "string" && source.avatarUrl ? source.avatarUrl : null,
    role: source.role === "member" ? "member" : "owner",
    createdAt: typeof source.createdAt === "string" ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : now,
  };
}

function migrateV1ToV2(raw: UnknownRecord): WorkspaceSnapshot {
  const now = new Date().toISOString();
  const workspace = isRecord(raw.workspace) ? raw.workspace : {};
  const workspaceId =
    typeof workspace.id === "string" && workspace.id ? workspace.id : "workspace_home";
  const profiles = asArray(raw.profiles);

  const migratedCostCenters: CostCenter[] = profiles.map((profile) => {
    const kind =
      typeof profile.kind === "string" && ["me", "partner", "shared"].includes(profile.kind)
        ? (profile.kind as CostCenterKind)
        : "me";

    return {
      ...(profile as UnknownRecord),
      id:
        typeof profile.id === "string" && profile.id
          ? profile.id
          : makeCostCenter(workspaceId, kind, now).id,
      name:
        typeof profile.name === "string" && profile.name
          ? profile.name
          : makeCostCenter(workspaceId, kind, now).name,
      color:
        typeof profile.color === "string" && profile.color
          ? profile.color
          : makeCostCenter(workspaceId, kind, now).color,
      icon:
        typeof profile.icon === "string" && profile.icon
          ? profile.icon
          : makeCostCenter(workspaceId, kind, now).icon,
      workspaceId,
      kind,
      module: getCenterModule(kind),
      active: profile.active !== false,
      createdAt:
        typeof profile.createdAt === "string" ? profile.createdAt : now,
      updatedAt:
        typeof profile.updatedAt === "string" ? profile.updatedAt : now,
    };
  }) as CostCenter[];

  const ensuredKinds = new Set(
    migratedCostCenters.map((center) => String(center.kind)) as CostCenterKind[],
  );

  (["me", "partner", "shared", "moto", "store"] as CostCenterKind[]).forEach((kind) => {
    if (!ensuredKinds.has(kind)) {
      migratedCostCenters.push(makeCostCenter(workspaceId, kind, now));
    }
  });

  const categories = asArray(raw.categories).map((category) => {
    const slug =
      typeof category.slug === "string"
        ? category.slug
        : typeof category.name === "string"
          ? category.name
          : "categoria";

    return {
      ...(category as UnknownRecord),
      scope: inferCategoryScope(slug),
      createdAt:
        typeof category.createdAt === "string" ? category.createdAt : now,
      updatedAt:
        typeof category.updatedAt === "string" ? category.updatedAt : now,
    };
  });

  const transactions = asArray(raw.transactions).map((transaction) => ({
    ...(transaction as UnknownRecord),
    centerId:
      typeof transaction.profileId === "string"
        ? transaction.profileId
        : typeof transaction.centerId === "string"
          ? transaction.centerId
          : migratedCostCenters[0]?.id ?? "profile_me",
    originModule: "finance",
    originRefId: null,
    lockedByOrigin: false,
    createdAt:
      typeof transaction.createdAt === "string" ? transaction.createdAt : now,
    updatedAt:
      typeof transaction.updatedAt === "string" ? transaction.updatedAt : now,
  }));

  const installments = asArray(raw.installments).map((installment) => ({
    ...(installment as UnknownRecord),
    centerId:
      typeof installment.profileId === "string"
        ? installment.profileId
        : typeof installment.centerId === "string"
          ? installment.centerId
          : migratedCostCenters[0]?.id ?? "profile_me",
    createdAt:
      typeof installment.createdAt === "string" ? installment.createdAt : now,
    updatedAt:
      typeof installment.updatedAt === "string" ? installment.updatedAt : now,
  }));

  const incomes = asArray(raw.incomes).map((income) => ({
    ...(income as UnknownRecord),
    centerId:
      typeof income.profileId === "string"
        ? income.profileId
        : typeof income.centerId === "string"
          ? income.centerId
          : migratedCostCenters[0]?.id ?? "profile_me",
    originModule: "finance",
    originRefId: null,
    lockedByOrigin: false,
    createdAt: typeof income.createdAt === "string" ? income.createdAt : now,
    updatedAt: typeof income.updatedAt === "string" ? income.updatedAt : now,
  }));

  const recurrences = asArray(raw.recurrences).map((rule) => ({
    ...(rule as UnknownRecord),
    centerId:
      typeof rule.profileId === "string"
        ? rule.profileId
        : typeof rule.centerId === "string"
          ? rule.centerId
          : migratedCostCenters[0]?.id ?? "profile_me",
    createdAt: typeof rule.createdAt === "string" ? rule.createdAt : now,
    updatedAt: typeof rule.updatedAt === "string" ? rule.updatedAt : now,
  }));

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const activeCenterIds = Array.isArray(settings.activeProfileIds)
    ? settings.activeProfileIds.filter((item): item is string => typeof item === "string")
    : migratedCostCenters.filter((center) => center.active).map((center) => center.id);

  const next = {
    ...(raw as UnknownRecord),
    version: typeof raw.version === "number" ? raw.version : 1,
    user: normalizeUser(raw.user, now),
    costCenters: migratedCostCenters,
    categories,
    cards: asArray(raw.cards),
    transactions,
    installments,
    incomes,
    budgets: asArray(raw.budgets),
    recurrences,
    vehicles: [],
    fuelLogs: [],
    maintenanceLogs: [],
    operationalSettings: {
      energyRatePerKwh: 1.15,
      printerPowerWatts: 80,
      extraFixedCostPerProduction: 2,
      manualLaborRatePerHour: 12,
    },
    filamentSpools: [],
    supplyItems: [],
    stockMovements: [],
    productionJobs: [],
    productionMaterialUsages: [],
    storeOrders: [],
    settings: {
      currency: "BRL",
      locale: "pt-BR",
      theme: settings.theme ?? "dark",
      salaryMonthly:
        typeof settings.salaryMonthly === "number" ? settings.salaryMonthly : 2000,
      vrMonthly: typeof settings.vrMonthly === "number" ? settings.vrMonthly : 800,
      salaryDay: typeof settings.salaryDay === "number" ? settings.salaryDay : 5,
      vrDay: typeof settings.vrDay === "number" ? settings.vrDay : 3,
      activeCenterIds,
      storageMode:
        settings.storageMode === "supabase" ? "supabase" : "local",
    },
    meta: {
      schemaVersion,
      seededAt:
        isRecord(raw.meta) && typeof raw.meta.seededAt === "string"
          ? raw.meta.seededAt
          : now,
      updatedAt:
        isRecord(raw.meta) && typeof raw.meta.updatedAt === "string"
          ? raw.meta.updatedAt
          : now,
      lastSyncedAt:
        isRecord(raw.meta) && typeof raw.meta.lastSyncedAt === "string"
          ? raw.meta.lastSyncedAt
          : null,
      importedFromLocalAt:
        isRecord(raw.meta) && typeof raw.meta.importedFromLocalAt === "string"
          ? raw.meta.importedFromLocalAt
          : null,
      lastMergedAt:
        isRecord(raw.meta) && typeof raw.meta.lastMergedAt === "string"
          ? raw.meta.lastMergedAt
          : null,
      lastMergedHash:
        isRecord(raw.meta) && typeof raw.meta.lastMergedHash === "string"
          ? raw.meta.lastMergedHash
          : null,
      migrationOrigin:
        isRecord(raw.meta) && typeof raw.meta.migrationOrigin === "string"
          ? raw.meta.migrationOrigin
          : "legacy-v1",
      dirty:
        isRecord(raw.meta) && typeof raw.meta.dirty === "boolean"
          ? raw.meta.dirty
          : false,
      source:
        isRecord(raw.meta) && raw.meta.source === "remote"
          ? "remote"
          : isRecord(raw.meta) && raw.meta.source === "local"
            ? "local"
            : "seed",
      storageMode:
        isRecord(raw.meta) && raw.meta.storageMode === "supabase"
          ? "supabase"
          : "local",
      appVersion,
    },
  };

  return workspaceSnapshotSchema.parse(next);
}

function normalizeV2(raw: UnknownRecord): WorkspaceSnapshot {
  const now = new Date().toISOString();
  const workspaceId =
    isRecord(raw.workspace) && typeof raw.workspace.id === "string"
      ? raw.workspace.id
      : "workspace_home";
  const centers = asArray(raw.costCenters);
  const costCenters: CostCenter[] = (["me", "partner", "shared", "moto", "store"] as CostCenterKind[]).map(
    (kind) => {
      const existing = centers.find((center) => center.kind === kind);

      if (existing) {
        return {
          ...(existing as UnknownRecord),
          id:
            typeof existing.id === "string" && existing.id
              ? existing.id
              : makeCostCenter(workspaceId, kind, now).id,
          name:
            typeof existing.name === "string" && existing.name
              ? existing.name
              : makeCostCenter(workspaceId, kind, now).name,
          color:
            typeof existing.color === "string" && existing.color
              ? existing.color
              : makeCostCenter(workspaceId, kind, now).color,
          icon:
            typeof existing.icon === "string" && existing.icon
              ? existing.icon
              : makeCostCenter(workspaceId, kind, now).icon,
          workspaceId,
          kind,
          active: existing.active !== false,
          module:
            typeof existing.module === "string"
              ? existing.module
              : getCenterModule(kind),
          createdAt:
            typeof existing.createdAt === "string" ? existing.createdAt : now,
          updatedAt:
            typeof existing.updatedAt === "string" ? existing.updatedAt : now,
        };
      }

      return makeCostCenter(workspaceId, kind, now);
    },
  ) as CostCenter[];

  const normalized = {
    ...(raw as UnknownRecord),
    user: normalizeUser(raw.user, now),
    costCenters,
    categories: asArray(raw.categories).map((category) => ({
      ...(category as UnknownRecord),
      scope:
        typeof category.scope === "string"
          ? category.scope
          : inferCategoryScope(
              typeof category.slug === "string"
                ? category.slug
                : String(category.name ?? "categoria"),
            ),
    })),
    transactions: asArray(raw.transactions).map((transaction) => ({
      ...(transaction as UnknownRecord),
      originModule:
        typeof transaction.originModule === "string"
          ? transaction.originModule
          : "finance",
      originRefId:
        typeof transaction.originRefId === "string" ? transaction.originRefId : null,
      lockedByOrigin: Boolean(transaction.lockedByOrigin),
    })),
    incomes: asArray(raw.incomes).map((income) => ({
      ...(income as UnknownRecord),
      originModule:
        typeof income.originModule === "string" ? income.originModule : "finance",
      originRefId: typeof income.originRefId === "string" ? income.originRefId : null,
      lockedByOrigin: Boolean(income.lockedByOrigin),
    })),
    vehicles: asArray(raw.vehicles),
    fuelLogs: asArray(raw.fuelLogs),
    maintenanceLogs: asArray(raw.maintenanceLogs),
    operationalSettings: {
      energyRatePerKwh:
        isRecord(raw.operationalSettings) &&
        typeof raw.operationalSettings.energyRatePerKwh === "number"
          ? raw.operationalSettings.energyRatePerKwh
          : 1.15,
      printerPowerWatts:
        isRecord(raw.operationalSettings) &&
        typeof raw.operationalSettings.printerPowerWatts === "number"
          ? raw.operationalSettings.printerPowerWatts
          : 80,
      extraFixedCostPerProduction:
        isRecord(raw.operationalSettings) &&
        typeof raw.operationalSettings.extraFixedCostPerProduction === "number"
          ? raw.operationalSettings.extraFixedCostPerProduction
          : 2,
      manualLaborRatePerHour:
        isRecord(raw.operationalSettings) &&
        typeof raw.operationalSettings.manualLaborRatePerHour === "number"
          ? raw.operationalSettings.manualLaborRatePerHour
          : 12,
    },
    filamentSpools: asArray(raw.filamentSpools),
    supplyItems: asArray(raw.supplyItems),
    stockMovements: asArray(raw.stockMovements),
    productionJobs: asArray(raw.productionJobs),
    productionMaterialUsages: asArray(raw.productionMaterialUsages),
    storeOrders: asArray(raw.storeOrders),
    settings: {
      ...(isRecord(raw.settings) ? raw.settings : {}),
      currency: "BRL",
      locale: "pt-BR",
      activeCenterIds:
        isRecord(raw.settings) && Array.isArray(raw.settings.activeCenterIds)
          ? raw.settings.activeCenterIds
          : costCenters.filter((center) => center.active).map((center) => center.id),
    },
    meta: {
      ...(isRecord(raw.meta) ? raw.meta : {}),
      schemaVersion,
      importedFromLocalAt:
        isRecord(raw.meta) && typeof raw.meta.importedFromLocalAt === "string"
          ? raw.meta.importedFromLocalAt
          : null,
      lastMergedAt:
        isRecord(raw.meta) && typeof raw.meta.lastMergedAt === "string"
          ? raw.meta.lastMergedAt
          : null,
      lastMergedHash:
        isRecord(raw.meta) && typeof raw.meta.lastMergedHash === "string"
          ? raw.meta.lastMergedHash
          : null,
      migrationOrigin:
        isRecord(raw.meta) && typeof raw.meta.migrationOrigin === "string"
          ? raw.meta.migrationOrigin
          : null,
      appVersion,
    },
  };

  return workspaceSnapshotSchema.parse(normalized);
}

export function parseWorkspaceSnapshot(raw: unknown): WorkspaceSnapshot {
  if (!isRecord(raw)) {
    throw new Error("Snapshot inválido.");
  }

  if (Array.isArray(raw.profiles) && !Array.isArray(raw.costCenters)) {
    return migrateV1ToV2(raw);
  }

  return normalizeV2(raw);
}

export function withStorageMode(
  snapshot: WorkspaceSnapshot,
  runtimeConfig: RuntimeConfig,
): WorkspaceSnapshot {
  return {
    ...snapshot,
    settings: {
      ...snapshot.settings,
      storageMode: runtimeConfig.storageMode,
    },
    meta: {
      ...snapshot.meta,
      schemaVersion,
      storageMode: runtimeConfig.storageMode,
      appVersion,
    },
  };
}
