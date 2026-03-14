import {
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
  async load(): Promise<WorkspaceSnapshot | null> {
    if (!hasIndexedDb()) {
      return localStorageAdapter.load();
    }

    try {
      const raw = await getItem<unknown>(localSnapshotKey);
      if (!raw) {
        return null;
      }

      return parseWorkspaceSnapshot(raw);
    } catch {
      return localStorageAdapter.load();
    }
  },

  async save(snapshot: WorkspaceSnapshot) {
    localStorageAdapter.save(snapshot);

    if (!hasIndexedDb()) {
      return;
    }

    await setItem(localSnapshotKey, snapshot);
  },

  async clear() {
    localStorageAdapter.clear();
    localStorageAdapter.clear(legacySnapshotKey);

    if (!hasIndexedDb()) {
      return;
    }

    await deleteItem(localSnapshotKey);
  },

  async migrateFromLegacyLocalStorage() {
    const current = await this.load();
    if (current) {
      return current;
    }

    const legacy = localStorageAdapter.load(legacySnapshotKey);
    if (!legacy) {
      return null;
    }

    await this.save(legacy);
    localStorageAdapter.clear(legacySnapshotKey);
    return legacy;
  },
};
