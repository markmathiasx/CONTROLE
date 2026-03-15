import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getRuntimeConfig,
  getStorageMode,
  getSupabaseAdminEnv,
  getSupabasePublicEnv,
  hasSupabaseEnv,
} from "@/lib/env";

describe("env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fica em modo local quando faltam envs do Supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(getSupabasePublicEnv()).toBeNull();
    expect(getSupabaseAdminEnv()).toBeNull();
    expect(hasSupabaseEnv()).toBe(false);
    expect(getStorageMode()).toBe("local");
    expect(getRuntimeConfig()).toMatchObject({
      storageMode: "local",
      hasSupabase: false,
      hasUsernameAuth: false,
    });
  });

  it("entra em modo supabase só quando a configuração pública e a service role existem", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("APP_LOCK_PIN", "1234");

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
    expect(getSupabaseAdminEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
      serviceRoleKey: "service-role-key",
    });
    expect(hasSupabaseEnv()).toBe(true);
    expect(getRuntimeConfig()).toMatchObject({
      storageMode: "supabase",
      hasSupabase: true,
      hasPinLock: true,
      hasUsernameAuth: true,
    });
  });
});
