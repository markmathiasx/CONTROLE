import type { RuntimeConfig, StorageMode } from "@/types/domain";

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnv || !serviceRoleKey) {
    return null;
  }

  return { ...publicEnv, serviceRoleKey };
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseAdminEnv());
}

export function getStorageMode(): StorageMode {
  return hasSupabaseEnv() ? "supabase" : "local";
}

export function getRuntimeConfig(): RuntimeConfig {
  const storageMode = getStorageMode();
  const hasSupabase = storageMode === "supabase";

  return {
    storageMode,
    hasSupabase,
    hasPinLock: Boolean(process.env.APP_LOCK_PIN),
    hasUsernameAuth: hasSupabase,
  };
}
