import { describe, expect, it } from "vitest";

import {
  createCloudSeedSnapshot,
  mergeWorkspaceSnapshots,
  pickPreferredWorkspaceSnapshot,
  rebaseSnapshotForWorkspace,
} from "@/utils/cloud-sync";
import { createSeedSnapshot } from "@/utils/seed";

describe("cloud sync helpers", () => {
  it("prefere o cache local quando ele está dirty", () => {
    const remote = createSeedSnapshot({
      storageMode: "supabase",
      seedMode: "demo",
      workspaceId: "workspace_cloud",
      userId: "user_cloud",
      username: "mark",
      displayName: "Mark",
      email: "mark@example.com",
    });
    const cached = structuredClone(remote);

    remote.meta.updatedAt = "2026-03-14T10:00:00.000Z";
    remote.meta.dirty = false;
    remote.version = 8;

    cached.meta.updatedAt = "2026-03-14T09:00:00.000Z";
    cached.meta.dirty = true;
    cached.version = 7;

    expect(pickPreferredWorkspaceSnapshot(remote, cached)).toEqual(cached);
  });

  it("prefere o cache local quando ele é mais novo que o remoto", () => {
    const remote = createSeedSnapshot("supabase");
    const cached = structuredClone(remote);

    remote.meta.updatedAt = "2026-03-14T08:00:00.000Z";
    remote.version = 3;
    cached.meta.updatedAt = "2026-03-14T09:30:00.000Z";
    cached.version = 2;

    expect(pickPreferredWorkspaceSnapshot(remote, cached)).toEqual(cached);
  });

  it("faz rebase do snapshot local para o workspace autenticado", () => {
    const localSnapshot = createSeedSnapshot("local");

    const rebased = rebaseSnapshotForWorkspace(localSnapshot, {
      storageMode: "supabase",
      workspaceId: "workspace_real",
      workspaceName: "Espaco Mark",
      userId: "user_real",
      username: "markreal",
      displayName: "Mark Real",
      email: "real@example.com",
      migrationOrigin: "local-first-login",
    });

    expect(rebased.workspace.id).toBe("workspace_real");
    expect(rebased.workspace.name).toBe("Espaco Mark");
    expect(rebased.user.id).toBe("user_real");
    expect(rebased.user.username).toBe("markreal");
    expect(rebased.transactions.every((item) => item.workspaceId === "workspace_real")).toBe(true);
    expect(rebased.meta.storageMode).toBe("supabase");
    expect(rebased.meta.migrationOrigin).toBe("local-first-login");
    expect(rebased.meta.dirty).toBe(true);
  });

  it("cria workspace cloud limpo para novos logins", () => {
    const cloudSeed = createCloudSeedSnapshot({
      storageMode: "supabase",
      workspaceId: "workspace_clean",
      workspaceName: "Conta limpa",
      userId: "user_clean",
      username: "userclean",
      displayName: "User Clean",
      email: "clean@example.com",
      migrationOrigin: "cloud-seed",
    });

    expect(cloudSeed.transactions).toHaveLength(0);
    expect(cloudSeed.incomes).toHaveLength(0);
    expect(cloudSeed.vehicles).toHaveLength(0);
    expect(cloudSeed.cards).toHaveLength(0);
    expect(cloudSeed.settings.salaryMonthly).toBe(0);
    expect(cloudSeed.settings.vrMonthly).toBe(0);
  });

  it("mescla snapshots deduplicando categorias e transações equivalentes", () => {
    const base = createSeedSnapshot({
      storageMode: "supabase",
      seedMode: "demo",
      workspaceId: "workspace_real",
      userId: "user_real",
      username: "markreal",
      displayName: "Mark Real",
      email: "real@example.com",
    });
    const incoming = structuredClone(base);

    incoming.meta.updatedAt = "2026-03-14T12:00:00.000Z";
    incoming.transactions = incoming.transactions.map((item, index) =>
      index === 0 ? { ...item, amount: item.amount + 12, updatedAt: "2026-03-14T12:00:00.000Z" } : item,
    );
    incoming.categories.push({
      id: "category_new_cloud_sync",
      workspaceId: incoming.workspace.id,
      name: "Teste cloud",
      slug: "teste-cloud",
      color: "#22c55e",
      icon: "wallet",
      keywords: ["teste"],
      budgetable: true,
      system: false,
      scope: "finance",
      createdAt: "2026-03-14T12:00:00.000Z",
      updatedAt: "2026-03-14T12:00:00.000Z",
    });

    const merged = mergeWorkspaceSnapshots(base, incoming);
    const mergedCategory = merged.categories.find((item) => item.slug === "teste-cloud");
    const transactionDescriptions = merged.transactions.map((item) => item.description);

    expect(mergedCategory).toBeTruthy();
    expect(transactionDescriptions.filter((item) => item === base.transactions[0]?.description)).toHaveLength(1);
    expect(merged.meta.lastMergedAt).toBeTruthy();
    expect(merged.meta.lastMergedHash).toContain(`${incoming.version}:`);
    expect(merged.version).toBeGreaterThan(base.version);
  });
});
