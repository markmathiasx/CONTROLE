import { ZodError } from "zod";

import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import { workspaceSnapshotSchema } from "@/lib/schemas";
import { enforceSameOrigin, jsonNoStore, parseJsonBody } from "@/lib/server-security";
import { getSupabaseServerClient } from "@/services/supabase/server";

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const supabase = await getSupabaseServerClient();

  if (!workspaceId || !supabase) {
    return jsonNoStore({ snapshot: null });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonNoStore({ snapshot: null, error: "Sessão inválida." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workspace_snapshots")
    .select("data")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    return jsonNoStore({ snapshot: null, error: error.message }, { status: 500 });
  }

  try {
    const snapshot = data?.data ? parseWorkspaceSnapshot(data.data) : null;
    return jsonNoStore({ snapshot });
  } catch {
    return jsonNoStore({ snapshot: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const blockedOrigin = enforceSameOrigin(request);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return jsonNoStore({ ok: false }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonNoStore({ ok: false, error: "Sessão inválida." }, { status: 401 });
  }

  const parsedBody = await parseJsonBody<{ workspaceId?: string; snapshot?: unknown }>(request, {
    maxBytes: 2 * 1024 * 1024,
  });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = parsedBody.data;

  if (!body.workspaceId || !body.snapshot) {
    return jsonNoStore({ ok: false }, { status: 400 });
  }

  let snapshot;
  try {
    snapshot = workspaceSnapshotSchema.parse(parseWorkspaceSnapshot(body.snapshot));
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonNoStore(
        { ok: false, error: "O snapshot enviado não passou na validação." },
        { status: 400 },
      );
    }

    return jsonNoStore(
      { ok: false, error: "Não foi possível interpretar o snapshot enviado." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("workspace_snapshots").upsert(
    {
      workspace_id: body.workspaceId,
      data: snapshot,
      version: snapshot.version,
      schema_version: snapshot.meta.schemaVersion,
      app_version: snapshot.meta.appVersion,
      migration_origin: snapshot.meta.migrationOrigin ?? null,
      imported_at: snapshot.meta.importedFromLocalAt ?? null,
      last_synced_by: user.id,
      updated_at: snapshot.meta.updatedAt,
    },
    {
      onConflict: "workspace_id",
    },
  );

  if (error) {
    return jsonNoStore({ ok: false, error: error.message }, { status: 500 });
  }

  return jsonNoStore({ ok: true });
}
