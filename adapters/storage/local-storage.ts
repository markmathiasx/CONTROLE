import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import type { WorkspaceSnapshot } from "@/types/domain";

export const legacySnapshotKey = "controle-financeiro:snapshot";
export const localSnapshotKey = "controle-financeiro:snapshot-v2";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export const localStorageAdapter = {
  loadRaw(key = localSnapshotKey): unknown | null {
    const storage = getStorage();
    const raw = storage?.getItem(key);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  load(key = localSnapshotKey): WorkspaceSnapshot | null {
    const raw = this.loadRaw(key);
    if (!raw) {
      return null;
    }

    try {
      return parseWorkspaceSnapshot(raw);
    } catch {
      return null;
    }
  },

  save(snapshot: WorkspaceSnapshot, key = localSnapshotKey) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(key, JSON.stringify(snapshot));
  },

  clear(key = localSnapshotKey) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(key);
  },
};
