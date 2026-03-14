import { beforeEach, describe, expect, it } from "vitest";

import { localStorageAdapter } from "@/adapters/storage/local-storage";
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
});
