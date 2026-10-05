import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  authenticate: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock("@/lib/blue/server", () => ({
  ...mocks,
  cookieName: "controle_blue_session",
}));
import { GET, POST } from "@/app/api/blue/route";
import { POST as reset } from "@/app/api/admin/reset-password/route";
const req = (body: unknown, origin = "http://localhost") =>
  new Request("http://localhost/api/blue", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => vi.clearAllMocks());
describe("Blue HTTP boundary", () => {
  it("rejects cross-origin credential mutations", async () => {
    expect(
      (
        await POST(
          req({ action: "login", payload: {} }, "https://attacker.test"),
        )
      ).status,
    ).toBe(403);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });
  it("does not expose a public signup or privileged RPC action", async () => {
    expect(
      (
        await POST(
          req({
            action: "session_issue",
            payload: { verified_user_id: "mark" },
          }),
        )
      ).status,
    ).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("puts the session in HttpOnly cookies rather than JSON", async () => {
    mocks.authenticate.mockResolvedValue({ ok: true, token: "secret" });
    const r = await POST(
      req({ action: "login", payload: { username: "mark", password: "test" } }),
    );
    expect(await r.json()).toEqual({ ok: true });
    expect(r.headers.get("set-cookie")).toContain("HttpOnly");
    expect(r.headers.get("set-cookie")).toContain("SameSite=strict");
  });
  it("blocks collaborator CSV export", async () => {
    mocks.rpc.mockResolvedValue({ ok: true, user: { username: "andressa" } });
    expect(
      (await GET(new Request("http://localhost/api/blue?export=csv"))).status,
    ).toBe(403);
  });
  it("propagates the authoritative admin reset denial", async () => {
    mocks.resetPassword.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Somente Mark.",
    });
    expect(
      (
        await reset(
          req({ payload: { username: "sidney", password: "new-password" } }),
        )
      ).status,
    ).toBe(403);
  });
  it("keeps private financial responses out of caches", async () => {
    mocks.rpc.mockResolvedValue({ ok: false, status: 401 });
    expect(
      (await GET(new Request("http://localhost/api/blue"))).headers.get(
        "cache-control",
      ),
    ).toContain("no-store");
  });
});
