import { NextResponse } from "next/server";

import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import { workspaceSnapshotSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/services/supabase/server";

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const supabase = getSupabaseAdminClient();

  if (!workspaceId || !supabase) {
    return NextResponse.json({ snapshot: null });
  }

  const { data, error } = await supabase
    .from("workspace_snapshots")
    .select("data")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ snapshot: null, error: error.message }, { status: 500 });
  }

  try {
    const snapshot = data?.data ? parseWorkspaceSnapshot(data.data) : null;
    return NextResponse.json({ snapshot });
  } catch {
    return NextResponse.json({ snapshot: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const body = (await request.json()) as { workspaceId?: string; snapshot?: unknown };

  if (!body.workspaceId || !body.snapshot) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const snapshot = workspaceSnapshotSchema.parse(parseWorkspaceSnapshot(body.snapshot));

  const { error } = await supabase.from("workspace_snapshots").upsert(
    {
      workspace_id: body.workspaceId,
      data: snapshot,
      version: snapshot.version,
      updated_at: snapshot.meta.updatedAt,
    },
    {
      onConflict: "workspace_id",
    },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
