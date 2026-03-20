import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseRouteHandlerClient: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/services/supabase/server", () => ({
  getSupabaseRouteHandlerClient: mocks.getSupabaseRouteHandlerClient,
}));

vi.mock("@/services/supabase/admin", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as signupPost } from "@/app/api/auth/signup/route";

function createRouteClient() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { session: { access_token: "token" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

function createAdminClient(result: { data: unknown; error: unknown }) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue(result),
        })),
      })),
    })),
  };
}

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz login por e-mail sem alterar a senha enviada", async () => {
    const routeClient = createRouteClient();
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue(routeClient);

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "mark@example.com",
          password: "  senha com espacos  ",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(routeClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "mark@example.com",
      password: "  senha com espacos  ",
    });
  });

  it("resolve username para email no server antes de autenticar", async () => {
    const routeClient = createRouteClient();
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue(routeClient);
    mocks.getSupabaseAdminClient.mockReturnValue(
      createAdminClient({ data: { email: "mark@example.com" }, error: null }),
    );

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "mark.login",
          password: "senha123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(routeClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "mark@example.com",
      password: "senha123",
    });
  });

  it("retorna signup com confirmação pendente quando o Supabase não cria sessão", async () => {
    const routeClient = createRouteClient();
    routeClient.auth.signUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue(routeClient);
    mocks.getSupabaseAdminClient.mockReturnValue(
      createAdminClient({ data: null, error: null }),
    );

    const response = await signupPost(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "mark.login",
          displayName: "Mark",
          email: "mark@example.com",
          password: "  Senha#123  ",
        }),
      }),
    );

    const payload = (await response.json()) as { ok?: boolean; needsEmailConfirmation?: boolean };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, needsEmailConfirmation: true });
    expect(routeClient.auth.signUp).toHaveBeenCalledWith({
      email: "mark@example.com",
      password: "  Senha#123  ",
      options: {
        data: {
          username: "mark.login",
          display_name: "Mark",
        },
      },
    });
  });

  it("bloqueia cadastro com senha fraca", async () => {
    const routeClient = createRouteClient();
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue(routeClient);
    mocks.getSupabaseAdminClient.mockReturnValue(
      createAdminClient({ data: null, error: null }),
    );

    const response = await signupPost(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "mark.login",
          displayName: "Mark",
          email: "mark@example.com",
          password: "senhafraca",
        }),
      }),
    );
    const payload = (await response.json()) as { ok?: boolean; error?: string };

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("senha forte");
    expect(routeClient.auth.signUp).not.toHaveBeenCalled();
  });

  it("faz logout mesmo quando o Supabase não está disponível", async () => {
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue(null);

    const response = await logoutPost(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
      }),
    );
    const payload = (await response.json()) as { ok?: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
  });

  it("bloqueia login quando a origem da requisição não confere", async () => {
    const routeClient = createRouteClient();
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue(routeClient);

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
        },
        body: JSON.stringify({
          identifier: "mark@example.com",
          password: "senha123",
        }),
      }),
    );

    const payload = (await response.json()) as { ok?: boolean; error?: string };

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(routeClient.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});
