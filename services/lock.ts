import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "controle_pin_lock";

function getSecret() {
  return process.env.APP_LOCK_PIN ?? "";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function getPinCookieName() {
  return cookieName;
}

export function createPinCookieValue() {
  const payload = "unlocked";
  return `${payload}.${sign(payload)}`;
}

export function verifyPinCookieValue(value?: string | null) {
  if (!value || !getSecret()) {
    return false;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expected = sign(payload);
  if (signature.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
