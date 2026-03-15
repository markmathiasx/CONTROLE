import { NextResponse } from "next/server";

import { checkRateLimit, enforceSameOrigin, jsonNoStore, parseJsonBody } from "@/lib/server-security";
import { createPinCookieValue, getPinCookieName } from "@/services/lock";

export async function POST(request: Request) {
  const blockedOrigin = enforceSameOrigin(request);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const blockedByRateLimit = checkRateLimit(request, {
    key: "pin-unlock",
    max: 6,
    windowMs: 60_000,
  });
  if (blockedByRateLimit) {
    return blockedByRateLimit;
  }

  const pin = process.env.APP_LOCK_PIN;

  if (!pin) {
    return jsonNoStore({ ok: true });
  }

  const parsedBody = await parseJsonBody<{ pin?: string }>(request, {
    maxBytes: 4 * 1024,
  });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = parsedBody.data;

  if (body.pin !== pin) {
    return jsonNoStore({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getPinCookieName(),
    value: createPinCookieValue(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}

export async function DELETE(request: Request) {
  const blockedOrigin = enforceSameOrigin(request);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const response = jsonNoStore({ ok: true });
  response.cookies.delete(getPinCookieName());
  return response;
}
