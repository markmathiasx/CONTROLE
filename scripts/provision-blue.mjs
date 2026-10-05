import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
const url = process.env.BLUE_SUPABASE_URL,
  key = process.env.BLUE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error(
    "Configure BLUE_SUPABASE_URL e BLUE_SUPABASE_SERVICE_ROLE_KEY em .env.local.",
  );
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
for (const [username, name, role] of [
  ["mark", "Mark", "admin"],
  ["andressa", "Andressa", "user"],
  ["sidney", "Sidney", "viewer"],
]) {
  const { data: existing, error: readError } = await client
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) continue;
  // Unpublished, random internal addresses prevent bypassing username-only login through the public Auth API.
  const email = `${randomBytes(24).toString("hex")}@accounts.controle-blue.invalid`;
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: randomBytes(32).toString("base64url"),
    email_confirm: true,
    app_metadata: { controle_blue_username: username },
  });
  if (error) throw error;
  const { error: profileError } = await client
    .from("profiles")
    .insert({ id: data.user.id, username, email, name, role });
  if (profileError) {
    await client.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }
}
const { data: mark, error } = await client
  .from("profiles")
  .select("id,first_login")
  .eq("username", "mark")
  .single();
if (error) throw error;
if (mark.first_login) {
  const activation = randomBytes(32).toString("hex");
  const { error: inviteError } = await client
    .from("profiles")
    .update({
      activation_hash: createHash("sha256").update(activation).digest("hex"),
      activation_expires: new Date(Date.now() + 7 * 86400000).toISOString(),
    })
    .eq("id", mark.id);
  if (inviteError) throw inviteError;
  const link =
    (process.env.BLUE_SITE_URL ?? "https://controle-blue.vercel.app") +
    "/login#user=mark&activation=" +
    activation;
  await writeFile(".blue-mark-activation.txt", link + "\n", { mode: 0o600 });
  console.log(
    "Contas criadas. Convite privado do Mark salvo em .blue-mark-activation.txt (válido por 7 dias).",
  );
} else
  console.log(
    "As três contas já existem. Senhas e permissões foram preservadas.",
  );
