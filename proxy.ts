import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/env";
import { getPinCookieName, verifyPinCookieValue } from "@/services/lock";

const basePublicPrefixes = [
  "/unlock",
  "/api/unlock",
  "/api/auth",
  "/icon",
  "/apple-icon",
  "/~offline",
  "/_next",
];

const authPublicPrefixes = ["/login", "/cadastro", "/logout"];
const authRedirectPrefixes = ["/login", "/cadastro"];

const protectedPrefixes = [
  "/financeiro",
  "/transacoes",
  "/cartoes",
  "/parcelas",
  "/categorias",
  "/orcamentos",
  "/relatorios",
  "/configuracoes",
  "/moto",
  "/loja",
  "/api/sync",
] as const;

function isPrefixed(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (allowedPath) => pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );
}

function requiresInternalAuth(pathname: string) {
  return pathname === "/" || isPrefixed(pathname, protectedPrefixes);
}

function requiresPin(pathname: string, hasCloud: boolean) {
  if (!process.env.APP_LOCK_PIN) {
    return false;
  }

  if (isPrefixed(pathname, basePublicPrefixes)) {
    return false;
  }

  if (hasCloud) {
    if (pathname === "/" || isPrefixed(pathname, authPublicPrefixes)) {
      return false;
    }

    return requiresInternalAuth(pathname);
  }

  return true;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasCloud = hasSupabaseEnv();
  const publicEnv = getSupabasePublicEnv();

  if (requiresPin(pathname, hasCloud)) {
    const cookie = request.cookies.get(getPinCookieName())?.value;
    if (!verifyPinCookieValue(cookie)) {
      const url = request.nextUrl.clone();
      url.pathname = "/unlock";
      return NextResponse.redirect(url);
    }
  }

  if (!hasCloud) {
    return NextResponse.next();
  }

  if (isPrefixed(pathname, basePublicPrefixes)) {
    return NextResponse.next();
  }

  const shouldCheckAuthSession =
    pathname === "/" ||
    isPrefixed(pathname, authPublicPrefixes) ||
    requiresInternalAuth(pathname);

  if (!shouldCheckAuthSession) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  if (!publicEnv) {
    return response;
  }
  const supabase = createServerClient(
    publicEnv.url,
    publicEnv.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isPrefixed(pathname, authRedirectPrefixes)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/");
    return NextResponse.redirect(url);
  }

  if (isPrefixed(pathname, authPublicPrefixes)) {
    return response;
  }

  if (user) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
