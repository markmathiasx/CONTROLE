"use client";

import type { Workspace } from "@/types/domain";

import { Badge } from "@/components/ui/badge";
import { getWorkspaceKindLabel } from "@/utils/workspaces";

export function WorkspaceContextList({
  workspaces,
  activeWorkspaceId,
  busyWorkspaceId,
  onSelect,
  getDescription,
  className = "space-y-2",
}: {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  busyWorkspaceId: string | null;
  onSelect: (workspace: Workspace, isActive: boolean) => void | Promise<void>;
  getDescription?: (workspace: Workspace) => string;
  className?: string;
}) {
  if (!workspaces.length) {
    return null;
  }

  return (
    <div className={className}>
      {workspaces.map((workspace) => {
        const isActive = workspace.id === activeWorkspaceId;
        const isBusy = busyWorkspaceId === workspace.id;
        const description = getDescription?.(workspace) ?? getWorkspaceKindLabel(workspace.isPersonal);

        return (
          <button
            key={workspace.id}
            type="button"
            aria-pressed={isActive}
            disabled={isBusy}
            className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
              isActive
                ? "border-emerald-400/30 bg-emerald-400/10"
                : "border-white/8 bg-black/20 hover:bg-white/6"
            } ${isBusy ? "opacity-70" : ""}`}
            onClick={() => void onSelect(workspace, isActive)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{workspace.name}</p>
                <p className="truncate text-xs text-zinc-400">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={workspace.isPersonal ? "muted" : "default"}>
                  {workspace.isPersonal ? "Pessoal" : "Compartilhado"}
                </Badge>
                <Badge variant={isActive ? "default" : "muted"}>
                  {isActive ? "Ativo" : isBusy ? "Abrindo..." : "Abrir"}
                </Badge>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
