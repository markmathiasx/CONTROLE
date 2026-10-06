import { NextRequest, NextResponse } from "next/server";
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    path === "/login" ||
    path === "/auth/setup-password" ||
    path.startsWith("/api/") ||
    path.startsWith("/icon") ||
    path.startsWith("/apple-icon")
  )
    return NextResponse.next();
  const token = request.cookies.get("controle_blue_session")?.value;
  const url = process.env.BLUE_SUPABASE_URL,
    key = process.env.BLUE_SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key)
    return NextResponse.redirect(new URL("/login", request.url));
  try {
    const r = await fetch(`${url}/rest/v1/rpc/blue_rpc`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
        "User-Agent": "MMSVH-Server/3.0",
      },
      body: JSON.stringify({
        action: "session",
        payload: {},
        session_token: token,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const session = await r.json();
    if (!session.ok)
      return NextResponse.redirect(new URL("/login", request.url));
    if (session.first_login)
      return NextResponse.redirect(
        new URL("/auth/setup-password", request.url),
      );
    if (
      session.role === "viewer" &&
      path !== "/casa" &&
      path !== "/dashboard" &&
      path !== "/"
    )
      return NextResponse.redirect(new URL("/dashboard", request.url));
    if (path.startsWith("/configuracoes") && session.username !== "mark")
      return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
