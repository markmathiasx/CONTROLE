import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import { getSupabaseBrowserClient } from "@/services/supabase/browser";
import type { WorkspaceSnapshot } from "@/types/domain";

type SnapshotListener = (snapshot: WorkspaceSnapshot) => void;
type SnapshotErrorListener = (error: Error) => void;

export const supabaseStorageAdapter = {
  async load(workspaceId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("workspace_snapshots")
      .select("data")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.data ? parseWorkspaceSnapshot(data.data) : null;
  },

  async save(workspaceId: string, snapshot: WorkspaceSnapshot, userId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { error } = await supabase.from("workspace_snapshots").upsert(
      {
        workspace_id: workspaceId,
        data: snapshot,
        version: snapshot.version,
        schema_version: snapshot.meta.schemaVersion,
        app_version: snapshot.meta.appVersion,
        migration_origin: snapshot.meta.migrationOrigin ?? null,
        imported_at: snapshot.meta.importedFromLocalAt ?? null,
        last_synced_by: userId,
        updated_at: snapshot.meta.updatedAt,
      },
      { onConflict: "workspace_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  },

  subscribe(workspaceId: string, onSnapshot: SnapshotListener, onError?: SnapshotErrorListener) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return () => undefined;
    }

    const channel = supabase
      .channel(`workspace-snapshot:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_snapshots",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          try {
            const raw = (payload.new as { data?: unknown } | null)?.data;
            if (!raw) {
              return;
            }
            const snapshot = parseWorkspaceSnapshot(raw);
            onSnapshot(snapshot);
          } catch (error) {
            onError?.(error instanceof Error ? error : new Error("Falha ao processar snapshot remoto."));
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          onError?.(new Error("Falha ao conectar o realtime do Supabase."));
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
