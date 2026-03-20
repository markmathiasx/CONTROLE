import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getSupabasePublicEnv: vi.fn(),
  hasSupabaseEnv: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/env", () => ({
  getSupabasePublicEnv: mocks.getSupabasePublicEnv,
  hasSupabaseEnv: mocks.hasSupabaseEnv,
}));

vi.mock("@/services/lock", () => ({
  getPinCookieName: () => "controle-lock",
  verifyPinCookieValue: () => true,
}));

import { proxy } from "@/proxy";

function createSupabaseClient(user: { id: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  };
}

describe("proxy auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseEnv.mockReturnValue(true);
    mocks.getSupabasePublicEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });

  it("mantém o app acessível em modo local sem exigir login", async () => {
    mocks.hasSupabaseEnv.mockReturnValue(false);

    const response = await proxy(new NextRequest("http://localhost/financeiro"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("redireciona áreas internas para /login quando a nuvem está ativa e não há sessão", async () => {
    mocks.createServerClient.mockReturnValue(createSupabaseClient(null));

    const response = await proxy(new NextRequest("http://localhost/financeiro?mes=2026-03"));
    const location = response.headers.get("location");

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(location).not.toBeNull();

    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("next")).toBe("/financeiro?mes=2026-03");
  });

  it("redireciona raiz para /login quando nuvem está ativa sem sessão", async () => {
    mocks.createServerClient.mockReturnValue(createSupabaseClient(null));

    const response = await proxy(new NextRequest("http://localhost/"));
    const location = response.headers.get("location");

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(location).not.toBeNull();

    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("next")).toBe("/");
  });

  it("redireciona usuário autenticado para / ao abrir /login", async () => {
    mocks.createServerClient.mockReturnValue(createSupabaseClient({ id: "user_1" }));

    const response = await proxy(new NextRequest("http://localhost/login"));
    const location = response.headers.get("location");

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(location).not.toBeNull();
    expect(new URL(location!).pathname).toBe("/");
  });
});
