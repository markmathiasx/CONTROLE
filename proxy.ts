import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPinCookieName, verifyPinCookieValue } from "@/services/lock";

const allowList = [
  "/unlock",
  "/api/unlock",
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/~offline",
];

export function proxy(request: NextRequest) {
  if (!process.env.APP_LOCK_PIN) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (allowList.some((allowedPath) => pathname.startsWith(allowedPath))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(getPinCookieName())?.value;
  if (verifyPinCookieValue(cookie)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
