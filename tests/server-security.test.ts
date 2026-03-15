import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, enforceSameOrigin, parseJsonBody } from "@/lib/server-security";

describe("server security helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aceita origem igual ao host atual", () => {
    const request = new Request("https://app.example.com/api/auth/login", {
      headers: {
        origin: "https://app.example.com",
      },
    });

    expect(enforceSameOrigin(request)).toBeNull();
  });

  it("bloqueia origem diferente do host atual", async () => {
    const request = new Request("https://app.example.com/api/auth/login", {
      headers: {
        origin: "https://evil.example",
      },
    });

    const response = enforceSameOrigin(request);
    const payload = (await response?.json()) as { ok?: boolean; error?: string };

    expect(response?.status).toBe(403);
    expect(payload.ok).toBe(false);
  });

  it("limita tentativas por janela de tempo", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));

    const request = new Request("https://app.example.com/api/auth/login", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
      },
    });

    expect(
      checkRateLimit(request, {
        key: "test-login",
        max: 2,
        windowMs: 60_000,
      }),
    ).toBeNull();

    expect(
      checkRateLimit(request, {
        key: "test-login",
        max: 2,
        windowMs: 60_000,
      }),
    ).toBeNull();

    const blocked = checkRateLimit(request, {
      key: "test-login",
      max: 2,
      windowMs: 60_000,
    });

    const payload = (await blocked?.json()) as { ok?: boolean; error?: string };

    expect(blocked?.status).toBe(429);
    expect(payload.ok).toBe(false);
  });

  it("rejeita payload JSON acima do limite", async () => {
    const request = new Request("https://app.example.com/api/sync", {
      method: "POST",
      body: JSON.stringify({
        payload: "x".repeat(128),
      }),
    });

    const parsed = await parseJsonBody<{ payload: string }>(request, {
      maxBytes: 32,
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.response.status).toBe(413);
    }
  });
});
