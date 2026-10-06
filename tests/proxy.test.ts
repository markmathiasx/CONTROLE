import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
const request = (path: string, cookie = true) =>
  new NextRequest("http://localhost" + path, {
    headers: cookie ? { cookie: "controle_blue_session=test" } : {},
  });
beforeEach(() => {
  vi.stubEnv("BLUE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("BLUE_SUPABASE_SERVICE_ROLE_KEY", "test");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Blue navigation authorization", () => {
  it("requires login even when the database is absent", async () => {
    vi.stubEnv("BLUE_SUPABASE_URL", "");
    expect((await proxy(request("/"))).headers.get("location")).toBe(
      "http://localhost/login",
    );
  });
  it("rejects a forged cookie after database verification", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ ok: false }) }),
    );
    expect((await proxy(request("/casa"))).headers.get("location")).toContain(
      "/login",
    );
  });
  it("forces first login into password setup", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          json: async () => ({ ok: true, first_login: true }),
        }),
    );
    expect((await proxy(request("/"))).headers.get("location")).toContain(
      "/auth/setup-password",
    );
  });
  it("redirects viewers away from editing routes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          json: async () => ({ ok: true, role: "viewer", username: "sidney" }),
        }),
    );
    expect((await proxy(request("/gastos"))).headers.get("location")).toContain(
      "/dashboard",
    );
  });
  it("hides administration from Andressa", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          json: async () => ({ ok: true, role: "user", username: "andressa" }),
        }),
    );
    expect(
      (await proxy(request("/configuracoes"))).headers.get("location"),
    ).toContain("/dashboard");
  });
});
