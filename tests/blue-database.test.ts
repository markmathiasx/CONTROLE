// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile } from "node:fs/promises";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
const db = new PGlite({ extensions: { pgcrypto } });
const ids = {
  mark: "00000000-0000-4000-8000-000000000001",
  andressa: "00000000-0000-4000-8000-000000000002",
  sidney: "00000000-0000-4000-8000-000000000003",
};
let sessions: Record<string, string> = {};
async function rpc(
  action: string,
  payload: Record<string, unknown> = {},
  user = "mark",
) {
  const result = await db.query<{ result: Record<string, unknown> }>(
    "select public.blue_rpc($1,$2::jsonb,$3) as result",
    [action, JSON.stringify(payload), sessions[user] ?? ""],
  );
  return result.rows[0].result;
}
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema extensions;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;`,
  );
  await db.exec(await readFile("supabase/blue/schema.sql", "utf8"));
  for (const [username, id] of Object.entries(ids)) {
    await db.query("insert into auth.users values($1)", [id]);
    await db.query(
      "insert into public.profiles(id,username,email,name,role,is_first_login) values($1,$2,$3,$2,$4,false)",
      [
        id,
        username,
        username + "@test.invalid",
        username === "mark"
          ? "admin"
          : username === "andressa"
            ? "user"
            : "viewer",
      ],
    );
  }
}, 30000);
beforeEach(async () => {
  await db.exec(
    "reset role;delete from blue_private.sessions;delete from blue_private.credential_jobs;delete from blue_private.rate_limits;delete from public.gastos;delete from public.casa_pagamentos;update public.casa_controle set total_cents=8000000,installment_cents=150000,opening_paid_cents=300000,opening_installments=2,due_day=10;update public.profiles set active=true,is_first_login=false,activation_hash=null,role=case username when 'mark' then 'admin' when 'andressa' then 'user' else 'viewer' end;set role service_role;",
  );
  sessions = {};
  for (const [username, id] of Object.entries(ids)) {
    const r = await rpc("session_issue", { verified_user_id: id }, "none");
    sessions[username] = String(r.token);
  }
});
afterAll(() => db.close());
const p = (id: string, amount = 150000) => ({
  id,
  amount_cents: amount,
  date: "2026-10-01",
  note: "Parcela",
});
describe("real PostgreSQL schema, authorization and accounting", () => {
  it("starts at exactly R$77000, with no fabricated payments", async () => {
    const d = await rpc("data");
    expect(d.ok).toBe(true);
    expect(d.payments).toEqual([]);
    expect(d.settings).toMatchObject({
      total_cents: 8000000,
      opening_paid_cents: 300000,
    });
  });
  it("denies every viewer mutation at the DB boundary", async () => {
    for (const action of [
      "payment_save",
      "entry_save",
      "settings",
      "invite",
      "reset_check",
    ]) {
      expect(
        await rpc(
          action,
          {
            ...p("10000000-0000-4000-8000-000000000001"),
            username: "andressa",
          },
          "sidney",
        ),
      ).toMatchObject({ ok: false, status: 403 });
    }
  });
  it("uses the authenticated owner and makes retries idempotent", async () => {
    const payload = {
      ...p("10000000-0000-4000-8000-000000000001"),
      user_id: ids.mark,
    };
    expect(await rpc("payment_save", payload, "andressa")).toMatchObject({
      ok: true,
    });
    await rpc("payment_save", payload, "andressa");
    const d = await rpc("data");
    expect(d.payments).toHaveLength(1);
    expect((d.payments as Record<string, unknown>[])[0].user_id).toBe(
      ids.andressa,
    );
    expect((d.payments as Record<string, unknown>[])[0].mes_referencia).toBe(
      "2026-10",
    );
    expect(d.settings).toMatchObject({ meses_pagos: 3 });
  });
  it("blocks collaborator edits/deletions of Mark payments", async () => {
    const id = "10000000-0000-4000-8000-000000000001";
    await rpc("payment_save", p(id));
    expect(await rpc("payment_save", p(id, 100000), "andressa")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(await rpc("payment_delete", { id }, "andressa")).toMatchObject({
      ok: false,
      status: 403,
    });
  });
  it("rejects overpayment and a total value below paid amounts", async () => {
    await rpc(
      "payment_save",
      p("10000000-0000-4000-8000-000000000001", 7600000),
    );
    expect(
      await rpc(
        "payment_save",
        p("10000000-0000-4000-8000-000000000002", 150000),
      ),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await rpc("settings", {
        total_cents: 7800000,
        installment_cents: 150000,
        due_day: 10,
      }),
    ).toMatchObject({ ok: false, status: 400 });
  });
  it("revokes all sessions on permission changes and prevents Mark lockout", async () => {
    expect(
      await rpc("user", { username: "sidney", role: "user" }),
    ).toMatchObject({ ok: true });
    expect(await rpc("data", {}, "sidney")).toMatchObject({
      ok: false,
      status: 401,
    });
    expect(
      await rpc("user", { username: "mark", role: "viewer" }),
    ).toMatchObject({ ok: false, status: 400 });
  });
  it("gates first login, consumes activation once and rejects concurrent claims", async () => {
    await db.exec(
      `reset role;update public.profiles set is_first_login=true,activation_hash=encode(extensions.digest('invite','sha256'),'hex'),activation_expires=now()+interval '1 day' where username='andressa';set role service_role;`,
    );
    expect(await rpc("data", {}, "andressa")).toMatchObject({
      ok: false,
      status: 401,
    });
    const lease = await rpc("activation_check", {
      username: "andressa",
      activation: "invite",
    });
    expect(lease.ok).toBe(true);
    expect(
      await rpc("activation_check", {
        username: "andressa",
        activation: "invite",
      }),
    ).toMatchObject({ ok: false, status: 409 });
    const r = await rpc("activation_commit", {
      verified_user_id: ids.andressa,
      lease: lease.lease,
    });
    expect(r).toMatchObject({ ok: true, needsSetup: false });
    expect(
      await rpc("activation_check", {
        username: "andressa",
        activation: "invite",
      }),
    ).toMatchObject({ ok: false, status: 401 });
  });
  it("allows only Mark to reset an activated user and invalidates the target session", async () => {
    expect(
      await rpc("reset_check", { username: "sidney" }, "andressa"),
    ).toMatchObject({ ok: false, status: 403 });
    const lease = await rpc("reset_check", { username: "sidney" });
    expect(lease.ok).toBe(true);
    expect(
      await rpc("reset_commit", {
        verified_user_id: ids.sidney,
        lease: lease.lease,
      }),
    ).toMatchObject({ ok: true });
    expect(await rpc("data", {}, "sidney")).toMatchObject({
      ok: false,
      status: 401,
    });
  });
  it("supports Mark resetting himself without losing authorization mid-operation", async () => {
    const lease = await rpc("reset_check", { username: "mark" });
    expect(lease.ok).toBe(true);
    expect(
      await rpc("reset_commit", {
        verified_user_id: ids.mark,
        lease: lease.lease,
      }),
    ).toMatchObject({ ok: true });
    expect(await rpc("data")).toMatchObject({ ok: false, status: 401 });
  });
  it("applies persistent login rate limits", async () => {
    for (let i = 0; i < 15; i++)
      expect((await rpc("auth_lookup", { username: "andressa" })).ok).toBe(
        true,
      );
    expect(await rpc("auth_lookup", { username: "andressa" })).toMatchObject({
      ok: false,
      status: 429,
    });
  });
  it("denies anonymous SQL/RPC and applies RLS to authenticated viewers", async () => {
    await db.exec("set role anon;");
    await expect(
      db.query("select public.blue_rpc('data','{}','forged')"),
    ).rejects.toThrow(/permission denied/);
    await db.exec(
      `reset role;set role authenticated;set request.jwt.claim.sub='${ids.sidney}';`,
    );
    expect(
      (await db.query("select * from public.casa_controle")).rows,
    ).toHaveLength(1);
    expect((await db.query("select * from public.gastos")).rows).toHaveLength(
      0,
    );
    await expect(
      db.query("update public.profiles set role='admin'"),
    ).rejects.toThrow(/permission denied/);
    await db.exec("reset role;");
  });
});
