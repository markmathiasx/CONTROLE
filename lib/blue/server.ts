import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
export const cookieName = "controle_blue_session";
export function adminClient() {
  const url = process.env.BLUE_SUPABASE_URL,
    key = process.env.BLUE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Banco do Controle Blue ainda não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function rpc(
  action: string,
  payload: Record<string, unknown> = {},
  token?: string,
) {
  const session = token ?? (await cookies()).get(cookieName)?.value ?? "";
  const { data, error } = await adminClient().rpc("blue_rpc", {
    action,
    payload,
    session_token: session,
  });
  if (error)
    throw new Error("O banco não respondeu. Tente novamente em instantes.");
  return data;
}
export function validPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 10 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
}
export async function authenticate(
  action: "login" | "activate" | "setup_password",
  payload: Record<string, unknown>,
) {
  const client = adminClient();
  if (action === "login") {
    if (
      typeof payload.username !== "string" ||
      !["mark", "andressa", "sidney"].includes(
        payload.username.trim().toLowerCase(),
      ) ||
      typeof payload.password !== "string" ||
      Buffer.byteLength(payload.password) > 72
    )
      return { ok: false, status: 400, error: "Informe usuário e senha." };
    const lookup = await rpc("auth_lookup", { username: payload.username }, "");
    if (!lookup.ok) return lookup;
    const { data, error } = await client.auth.signInWithPassword({
      email: lookup.email,
      password: payload.password,
    });
    if (error || data.user?.id !== lookup.id)
      return { ok: false, status: 401, error: "Dados de acesso inválidos." };
    const session = await rpc(
      "session_issue",
      { verified_user_id: data.user.id },
      "",
    );
    // Supabase JWT/refresh tokens stay exclusively on the server; browser gets a revocable DB session.
    await client.auth.signOut();
    return session;
  }
  if (!validPassword(payload.password))
    return {
      ok: false,
      status: 400,
      error: "Use uma senha de no mínimo 10 caracteres e até 72 bytes.",
    };
  const check =
    action === "activate"
      ? await rpc("activation_check", payload, "")
      : await rpc("setup_check");
  if (!check.ok) return check;
  const { error } = await client.auth.admin.updateUserById(check.id, {
    password: payload.password,
  });
  if (error) {
    await rpc(
      "credential_release",
      { verified_user_id: check.id, lease: check.lease },
      "",
    );
    return {
      ok: false,
      status: 400,
      error:
        "Não foi possível criar a senha. Confira os requisitos e tente novamente.",
    };
  }
  return rpc(
    "activation_commit",
    { verified_user_id: check.id, lease: check.lease },
    "",
  );
}
export async function resetPassword(payload: Record<string, unknown>) {
  if (!validPassword(payload.password))
    return {
      ok: false,
      status: 400,
      error: "Use uma senha de no mínimo 10 caracteres e até 72 bytes.",
    };
  const check = await rpc("reset_check", { username: payload.username });
  if (!check.ok) return check;
  const { error } = await adminClient().auth.admin.updateUserById(check.id, {
    password: payload.password,
  });
  if (error) {
    await rpc(
      "credential_release",
      { verified_user_id: check.id, lease: check.lease },
      "",
    );
    return {
      ok: false,
      status: 400,
      error: "Não foi possível alterar a senha.",
    };
  }
  return rpc("reset_commit", {
    verified_user_id: check.id,
    lease: check.lease,
  });
}
