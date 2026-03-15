import { NextResponse } from "next/server";

import { checkRateLimit, enforceSameOrigin, jsonNoStore, parseJsonBody } from "@/lib/server-security";
import { getSupabaseAdminClient } from "@/services/supabase/admin";
import { getSupabaseRouteHandlerClient } from "@/services/supabase/server";

const usernamePattern = /^[a-z0-9._-]{3,24}$/;

export async function POST(request: Request) {
  const blockedOrigin = enforceSameOrigin(request);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const blockedByRateLimit = checkRateLimit(request, {
    key: "auth-signup",
    max: 5,
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

  const parsedBody = await parseJsonBody<{
    email?: string;
    password?: string;
    username?: string;
    displayName?: string;
  }>(request, {
    maxBytes: 12 * 1024,
  });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = parsedBody.data;

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const displayName = body.displayName?.trim() ?? "";

  if (!email || !password || !username || !displayName) {
    return jsonNoStore(
      { ok: false, error: "Preencha login, nome, e-mail e senha." },
      { status: 400 },
    );
  }

  if (!usernamePattern.test(username)) {
    return jsonNoStore(
      {
        ok: false,
        error: "Use um login com 3 a 24 caracteres, sem espaços, usando letras, números, ponto, hífen ou underline.",
      },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return jsonNoStore(
      { ok: false, error: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data: existingUser } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle<{ id: string }>();

    if (existingUser?.id) {
      return jsonNoStore(
        { ok: false, error: "Esse login já está em uso." },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")
        ? "Esse e-mail já está cadastrado."
        : error.message.toLowerCase().includes("profiles_username")
          ? "Esse login já está em uso."
          : "Não foi possível criar a conta agora.";

    return jsonNoStore({ ok: false, error: message }, { status: 400 });
  }

  return jsonNoStore(
    {
      ok: true,
      needsEmailConfirmation: !data.session,
    },
    { headers: response.headers },
  );
}
