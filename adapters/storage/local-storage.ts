import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import type { WorkspaceSnapshot } from "@/types/domain";

export const legacySnapshotKey = "controle-financeiro:snapshot";
export const anonymousSnapshotKey = "controle-financeiro:snapshot-anonymous-v3";
export const localSnapshotKey = anonymousSnapshotKey;
export const localImportStateKey = "controle-financeiro:local-import-state";

export function getWorkspaceSnapshotKey(workspaceId: string) {
  return `controle-financeiro:snapshot:${workspaceId}`;
}

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

  loadImportState<T = unknown>() {
    const storage = getStorage();
    const raw = storage?.getItem(localImportStateKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  saveImportState(value: unknown) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(localImportStateKey, JSON.stringify(value));
  },
};
