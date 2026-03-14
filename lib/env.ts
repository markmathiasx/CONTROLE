import type { RuntimeConfig, StorageMode } from "@/types/domain";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getStorageMode(): StorageMode {
  return hasSupabaseEnv() ? "supabase" : "local";
}

export function getRuntimeConfig(): RuntimeConfig {
  const storageMode = getStorageMode();

  return {
    storageMode,
    hasSupabase: storageMode === "supabase",
    hasPinLock: Boolean(process.env.APP_LOCK_PIN),
  };
}
