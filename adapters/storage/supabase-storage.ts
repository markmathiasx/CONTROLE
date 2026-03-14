import type { WorkspaceSnapshot } from "@/types/domain";

export const supabaseStorageAdapter = {
  async load(workspaceId: string) {
    const response = await fetch(`/api/sync?workspaceId=${workspaceId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { snapshot?: WorkspaceSnapshot | null };
    return data.snapshot ?? null;
  },

  async save(workspaceId: string, snapshot: WorkspaceSnapshot) {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workspaceId, snapshot }),
    });

    if (!response.ok) {
      throw new Error("Falha ao sincronizar com o Supabase.");
    }
  },
};
