import { beforeEach, describe, expect, it } from "vitest";

import { getWorkspaceSnapshotKey, localStorageAdapter } from "@/adapters/storage/local-storage";
import { createSeedSnapshot } from "@/utils/seed";

describe("localStorageAdapter", () => {
  beforeEach(() => {
    localStorageAdapter.clear();
  });

  it("salva e recupera snapshot validado", () => {
    const snapshot = createSeedSnapshot("local");

    localStorageAdapter.save(snapshot);
    const loaded = localStorageAdapter.load();

    expect(loaded?.workspace.id).toBe(snapshot.workspace.id);
    expect(loaded?.transactions.length).toBe(snapshot.transactions.length);
  });

  it("gera chaves namespaced por workspace", () => {
    expect(getWorkspaceSnapshotKey("workspace_123")).toBe("controle-financeiro:snapshot:workspace_123");
  });

  it("salva snapshots diferentes em chaves diferentes", () => {
    const first = createSeedSnapshot({
      storageMode: "local",
      workspaceId: "workspace_a",
      userId: "user_a",
      username: "a",
      displayName: "A",
      email: "a@example.com",
    });
    const second = createSeedSnapshot({
      storageMode: "local",
      workspaceId: "workspace_b",
      userId: "user_b",
      username: "b",
      displayName: "B",
      email: "b@example.com",
    });

    localStorageAdapter.save(first, getWorkspaceSnapshotKey("workspace_a"));
    localStorageAdapter.save(second, getWorkspaceSnapshotKey("workspace_b"));

    expect(localStorageAdapter.load(getWorkspaceSnapshotKey("workspace_a"))?.workspace.id).toBe("workspace_a");
    expect(localStorageAdapter.load(getWorkspaceSnapshotKey("workspace_b"))?.workspace.id).toBe("workspace_b");
  });
});
