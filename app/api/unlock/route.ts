import { NextResponse } from "next/server";

import { createPinCookieValue, getPinCookieName } from "@/services/lock";

export async function POST(request: Request) {
  const pin = process.env.APP_LOCK_PIN;

  if (!pin) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json()) as { pin?: string };

  if (body.pin !== pin) {
    return NextResponse.json({ ok: false }, { status: 401 });
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

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getPinCookieName());
  return response;
}
