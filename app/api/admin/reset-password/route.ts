import { NextResponse } from "next/server";
import { resetPassword, cookieName } from "@/lib/blue/server";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { ok: false, error: "Origem inválida." },
      { status: 403, headers },
    );
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 4000)
      return NextResponse.json(
        { ok: false, error: "Requisição grande demais." },
        { status: 413, headers },
      );
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "JSON inválido." },
        { status: 400, headers },
      );
    }
    const result = await resetPassword(body.payload ?? {});
    const response = NextResponse.json(result, {
      status: result.status ?? 200,
      headers,
    });
    if (result.ok && body.payload?.username === "mark")
      response.cookies.set(cookieName, "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível alterar a senha." },
      { status: 503, headers },
    );
  }
}
