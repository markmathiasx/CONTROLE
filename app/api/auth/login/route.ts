import { NextResponse } from "next/server";

import { checkRateLimit, enforceSameOrigin, jsonNoStore, parseJsonBody } from "@/lib/server-security";
import { getSupabaseAdminClient } from "@/services/supabase/admin";
import { getSupabaseRouteHandlerClient } from "@/services/supabase/server";

function invalidCredentials() {
  return jsonNoStore(
    { ok: false, error: "Login ou senha inválidos." },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  const blockedOrigin = enforceSameOrigin(request);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const blockedByRateLimit = checkRateLimit(request, {
    key: "auth-login",
    max: 8,
    windowMs: 60_000,
  });
  if (blockedByRateLimit) {
    return blockedByRateLimit;
  }

  const response = NextResponse.json({ ok: true });
  const supabase = await getSupabaseRouteHandlerClient(response);
  if (!supabase) {
    return jsonNoStore(
      { ok: false, error: "Supabase não configurado neste ambiente." },
      { status: 503 },
    );
  }

  const parsedBody = await parseJsonBody<{ identifier?: string; password?: string }>(request, {
    maxBytes: 8 * 1024,
  });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = parsedBody.data;
  const identifier = body.identifier?.trim() ?? "";
  const password = body.password ?? "";

  if (!identifier || !password) {
    return jsonNoStore(
      { ok: false, error: "Preencha login/e-mail e senha." },
      { status: 400 },
    );
  }

  let email = identifier.toLowerCase();

  if (!identifier.includes("@")) {
    const admin = getSupabaseAdminClient();
    if (!admin) {
      return jsonNoStore(
        {
          ok: false,
          error:
            "Este ambiente não consegue autenticar por login sem a chave server-side do Supabase.",
        },
        { status: 503 },
      );
    }

    const { data, error } = await admin
      .from("profiles")
      .select("email")
      .eq("username", identifier.toLowerCase())
      .maybeSingle<{ email: string }>();

    if (error || !data?.email) {
      return invalidCredentials();
    }

    email = data.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return invalidCredentials();
  }

  return jsonNoStore({ ok: true }, { headers: response.headers });
}
