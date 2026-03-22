import {
  anonymousSnapshotKey,
  getWorkspaceSnapshotKey,
  legacySnapshotKey,
  localSnapshotKey,
  localStorageAdapter,
} from "@/adapters/storage/local-storage";
import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import type { WorkspaceSnapshot } from "@/types/domain";

const databaseName = "controle-financeiro-db";
const storeName = "workspace_snapshots";

function hasIndexedDb() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getItem<T>(key: string) {
  const database = await openDatabase();

  return new Promise<T | null>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);

    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function setItem<T>(key: string, value: T) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function deleteItem(key: string) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export const localDbAdapter = {
  async load(key = localSnapshotKey): Promise<WorkspaceSnapshot | null> {
    if (!hasIndexedDb()) {
      return localStorageAdapter.load(key);
    }

    try {
      const raw = await getItem<unknown>(key);
      if (!raw) {
        return null;
      }

      return parseWorkspaceSnapshot(raw);
    } catch {
      return localStorageAdapter.load(key);
    }
  },

  async save(snapshot: WorkspaceSnapshot, key = localSnapshotKey) {
    localStorageAdapter.save(snapshot, key);

    if (!hasIndexedDb()) {
      return;
    }

    try {
      await setItem(key, snapshot);
    } catch {
      // The localStorage mirror keeps the app usable when IndexedDB is unstable or full.
    }
  },

  async clear(key = localSnapshotKey) {
    localStorageAdapter.clear(key);
    localStorageAdapter.clear(legacySnapshotKey);

    if (!hasIndexedDb()) {
      return;
    }

    try {
      await deleteItem(key);
    } catch {
      // If IndexedDB cleanup fails, the localStorage mirror is already cleared above.
    }
  },

  async migrateFromLegacyLocalStorage() {
    const current = await this.load(anonymousSnapshotKey);
    if (current) {
      return current;
    }

    const legacy = localStorageAdapter.load(legacySnapshotKey);
    if (!legacy) {
      return null;
    }

    await this.save(legacy, anonymousSnapshotKey);
    localStorageAdapter.clear(legacySnapshotKey);
    return legacy;
  },

  async loadAnonymous() {
    return this.load(anonymousSnapshotKey);
  },

  async saveAnonymous(snapshot: WorkspaceSnapshot) {
    await this.save(snapshot, anonymousSnapshotKey);
  },

  async clearAnonymous() {
    await this.clear(anonymousSnapshotKey);
  },

  async loadWorkspace(workspaceId: string) {
    return this.load(getWorkspaceSnapshotKey(workspaceId));
  },

  async saveWorkspace(workspaceId: string, snapshot: WorkspaceSnapshot) {
    await this.save(snapshot, getWorkspaceSnapshotKey(workspaceId));
  },

  async clearWorkspace(workspaceId: string) {
    await this.clear(getWorkspaceSnapshotKey(workspaceId));
  },
};
