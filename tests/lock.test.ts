import { afterEach, describe, expect, it, vi } from "vitest";

import { createPinCookieValue, verifyPinCookieValue } from "@/services/lock";

describe("pin lock helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("valida o cookie gerado com o segredo atual", () => {
    vi.stubEnv("APP_LOCK_PIN", "1234");

    const value = createPinCookieValue();

    expect(verifyPinCookieValue(value)).toBe(true);
  });

  it("retorna false para assinatura malformada sem lançar erro", () => {
    vi.stubEnv("APP_LOCK_PIN", "1234");

    expect(verifyPinCookieValue("unlocked.x")).toBe(false);
  });
});
