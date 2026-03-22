"use client";

import { create } from "zustand";

import { localDbAdapter } from "@/adapters/storage/local-db";
import { localStorageAdapter } from "@/adapters/storage/local-storage";
import { supabaseStorageAdapter } from "@/adapters/storage/supabase-storage";
import {
  createCloudSeedSnapshot,
  hasAnonymousLocalChanges,
  mergeWorkspaceSnapshots,
  pickPreferredWorkspaceSnapshot,
  rebaseSnapshotForWorkspace,
} from "@/utils/cloud-sync";
import { useFinanceStore } from "@/store/use-finance-store";
import { getSupabaseBrowserClient } from "@/services/supabase/browser";
import type { RuntimeConfig, ThemeMode, User, UserSettingsRecord, Workspace, WorkspaceMember, WorkspaceSnapshot } from "@/types/domain";
import { buildWorkspaceSlug } from "@/utils/workspaces";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "local";

type ImportDecision = "merged" | "skipped";

interface AuthStoreState {
  runtimeConfig: RuntimeConfig;
  initialized: boolean;
  status: AuthStatus;
  profile: User | null;
  workspaces: Workspace[];
  memberships: WorkspaceMember[];
  userSettings: UserSettingsRecord | null;
  activeWorkspaceId: string | null;
  authError: string | null;
  profileMenuOpen: boolean;
  onboardingOpen: boolean;
  localImportSnapshot: WorkspaceSnapshot | null;
  bootstrap: (config: RuntimeConfig) => Promise<void>;
  refresh: () => Promise<void>;
  setProfileMenuOpen: (open: boolean) => void;
  completeInitialSetup: (params: { workspaceName: string; theme: ThemeMode; importDecision: ImportDecision }) => Promise<void>;
  updateThemePreference: (theme: ThemeMode) => Promise<void>;
  updateProfile: (params: { displayName: string; avatarUrl?: string | null }) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (params: { name: string; isPersonal: boolean }) => Promise<void>;
  renameWorkspace: (workspaceId: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceRow = {
  id: string;
  slug: string;
  name: string;
  owner_user_id: string;
  is_personal: boolean;
  created_at: string;
  updated_at: string;
};

type WorkspaceMemberRow = {
  workspace_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
  updated_at: string;
};

type UserSettingsRow = {
  user_id: string;
  active_workspace_id: string | null;
  theme: ThemeMode;
  onboarding_completed: boolean;
  local_import_decision: ImportDecision | null;
  imported_from_local_at: string | null;
  last_local_merge_hash: string | null;
  created_at: string;
  updated_at: string;
};

let authListenerCleanup: (() => void) | null = null;
let realtimeCleanup: (() => void) | null = null;

function getDefaultRuntimeConfig(): RuntimeConfig {
  return {
    storageMode: "local",
    hasSupabase: false,
    hasPinLock: false,
    hasUsernameAuth: false,
    hasOpenAI: false,
  };
}

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: "owner",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    ownerUserId: row.owner_user_id,
    isPersonal: row.is_personal,
    branding: {
      appName: row.name,
      accent: "#10b981",
      logoMode: "glyph",
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMembership(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: `${row.workspace_id}:${row.user_id}`,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserSettings(row: UserSettingsRow): UserSettingsRecord {
  return {
    id: row.user_id,
    userId: row.user_id,
    activeWorkspaceId: row.active_workspace_id,
    theme: row.theme,
    onboardingCompleted: row.onboarding_completed,
    localImportDecision: row.local_import_decision,
    importedFromLocalAt: row.imported_from_local_at,
    lastLocalMergeHash: row.last_local_merge_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchAuthContext(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const [{ data: profileRow, error: profileError }, { data: membershipRows, error: membershipError }, { data: settingsRow, error: settingsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, email, avatar_url, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id, user_id, role, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("user_settings")
        .select("user_id, active_workspace_id, theme, onboarding_completed, local_import_decision, imported_from_local_at, last_local_merge_hash, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const workspaceIds = (membershipRows ?? []).map((item) => item.workspace_id);
  const { data: workspaceRows, error: workspaceError } = workspaceIds.length
    ? await supabase
        .from("workspaces")
        .select("id, slug, name, owner_user_id, is_personal, created_at, updated_at")
        .in("id", workspaceIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  return {
    profile: profileRow ? mapProfile(profileRow as ProfileRow) : null,
    memberships: ((membershipRows ?? []) as WorkspaceMemberRow[]).map(mapMembership),
    workspaces: ((workspaceRows ?? []) as WorkspaceRow[]).map(mapWorkspace),
    userSettings: settingsRow ? mapUserSettings(settingsRow as UserSettingsRow) : null,
  };
}

function clearRealtime() {
  if (realtimeCleanup) {
    realtimeCleanup();
    realtimeCleanup = null;
  }
}

function saveLocalImportDecision(userId: string, decision: ImportDecision, workspaceId: string) {
  const current = localStorageAdapter.loadImportState<Record<string, { decision: ImportDecision; workspaceId: string; at: string }>>() ?? {};
  current[userId] = { decision, workspaceId, at: new Date().toISOString() };
  localStorageAdapter.saveImportState(current);
}

function getLocalImportDecision(userId: string) {
  const current = localStorageAdapter.loadImportState<Record<string, { decision: ImportDecision; workspaceId: string; at: string }>>() ?? {};
  return current[userId]?.decision ?? null;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  runtimeConfig: getDefaultRuntimeConfig(),
  initialized: false,
  status: "loading",
  profile: null,
  workspaces: [],
  memberships: [],
  userSettings: null,
  activeWorkspaceId: null,
  authError: null,
  profileMenuOpen: false,
  onboardingOpen: false,
  localImportSnapshot: null,
  async bootstrap(config) {
    set({ runtimeConfig: config, authError: null });

    if (!config.hasSupabase) {
      await useFinanceStore.getState().bootstrap(config);
      set({ initialized: true, status: "local" });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      await useFinanceStore.getState().bootstrap(config);
      set({ initialized: true, status: "local" });
      return;
    }

    if (!authListenerCleanup) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        void get().refresh();
      });
      authListenerCleanup = () => data.subscription.unsubscribe();
    }

    await get().refresh();
  },
  async refresh() {
    const { runtimeConfig } = get();

    if (!runtimeConfig.hasSupabase) {
      set({ initialized: true, status: "local" });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      set({ initialized: true, status: "local" });
      return;
    }

    set({ status: "loading", authError: null });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      set({ initialized: true, status: "unauthenticated", authError: sessionError.message });
      useFinanceStore.getState().clearWorkspaceState();
      clearRealtime();
      return;
    }

    if (!session?.user) {
      set({
        initialized: true,
        status: "unauthenticated",
        profile: null,
        workspaces: [],
        memberships: [],
        userSettings: null,
        activeWorkspaceId: null,
        onboardingOpen: false,
        localImportSnapshot: null,
      });
      useFinanceStore.getState().clearWorkspaceState();
      clearRealtime();
      return;
    }

    try {
      const authContext = await fetchAuthContext(session.user.id);
      if (!authContext?.profile) {
        throw new Error("Perfil do usuário não encontrado.");
      }

      const activeWorkspaceId =
        authContext.userSettings?.activeWorkspaceId ??
        authContext.memberships[0]?.workspaceId ??
        authContext.workspaces[0]?.id ??
        null;

      if (!activeWorkspaceId) {
        throw new Error("Workspace ativo não encontrado.");
      }

      const activeWorkspace =
        authContext.workspaces.find((item) => item.id === activeWorkspaceId) ?? authContext.workspaces[0];
      const profileId = authContext.profile.id;

      const financeStore = useFinanceStore.getState();
      const anonymousSnapshot = await localDbAdapter.loadAnonymous();
      const cachedWorkspaceSnapshot = await localDbAdapter.loadWorkspace(activeWorkspaceId);
      const remoteSnapshot = await supabaseStorageAdapter.load(activeWorkspaceId).catch(() => null);
      const preferredSnapshot = pickPreferredWorkspaceSnapshot(remoteSnapshot, cachedWorkspaceSnapshot);

      const baseSnapshot =
        preferredSnapshot ??
        createCloudSeedSnapshot({
          storageMode: runtimeConfig.storageMode,
          workspaceId: activeWorkspaceId,
          workspaceName: activeWorkspace?.name ?? authContext.profile.displayName,
          userId: authContext.profile.id,
          username: authContext.profile.username,
          displayName: authContext.profile.displayName,
          email: authContext.profile.email,
          migrationOrigin: "cloud-seed",
        });

      baseSnapshot.user = authContext.profile;
      baseSnapshot.workspace = activeWorkspace ?? baseSnapshot.workspace;
      baseSnapshot.settings.theme = authContext.userSettings?.theme ?? baseSnapshot.settings.theme;

      await financeStore.hydrateWorkspace({
        config: runtimeConfig,
        snapshot: baseSnapshot,
        workspaceId: activeWorkspaceId,
        userId: authContext.profile.id,
        syncStatus:
          runtimeConfig.storageMode === "supabase"
            ? baseSnapshot.meta.dirty
              ? "error"
              : remoteSnapshot
                ? "synced"
                : "syncing"
            : "local",
      });

      if (!remoteSnapshot || baseSnapshot.meta.dirty) {
        void financeStore.persistNow({ immediate: true });
      }

      const localDecision = getLocalImportDecision(authContext.profile.id);
      const resolvedImportDecision = authContext.userSettings?.localImportDecision ?? localDecision;
      const shouldPromptImport = hasAnonymousLocalChanges(anonymousSnapshot) && !resolvedImportDecision;

      set({
        initialized: true,
        status: "authenticated",
        profile: authContext.profile,
        workspaces: authContext.workspaces,
        memberships: authContext.memberships,
        userSettings: authContext.userSettings,
        activeWorkspaceId,
        onboardingOpen: !authContext.userSettings?.onboardingCompleted || shouldPromptImport,
        localImportSnapshot:
          shouldPromptImport && anonymousSnapshot
            ? rebaseSnapshotForWorkspace(anonymousSnapshot, {
                storageMode: runtimeConfig.storageMode,
                workspaceId: activeWorkspaceId,
                workspaceName: activeWorkspace?.name ?? authContext.profile.displayName,
                userId: authContext.profile.id,
                username: authContext.profile.username,
                displayName: authContext.profile.displayName,
                email: authContext.profile.email,
                migrationOrigin: "local-first-login",
              })
            : null,
      });

      clearRealtime();
      realtimeCleanup = supabaseStorageAdapter.subscribe(
        activeWorkspaceId,
        (snapshot) => {
          const currentSnapshot = useFinanceStore.getState().snapshot;
          const currentUpdatedAt = currentSnapshot
            ? new Date(currentSnapshot.meta.updatedAt).getTime()
            : 0;
          const incomingUpdatedAt = new Date(snapshot.meta.updatedAt).getTime();
          if (
            currentSnapshot &&
            currentSnapshot.meta.dirty &&
            (currentUpdatedAt >= incomingUpdatedAt || currentSnapshot.version >= snapshot.version)
          ) {
            return;
          }

          void useFinanceStore.getState().hydrateWorkspace({
            config: runtimeConfig,
            snapshot: {
              ...snapshot,
              settings: { ...snapshot.settings, theme: authContext.userSettings?.theme ?? snapshot.settings.theme },
            },
            workspaceId: activeWorkspaceId,
            userId: profileId,
            syncStatus: "synced",
          });
        },
        (error) => {
          useFinanceStore.setState({
            syncStatus: "error",
            syncError: error.message,
          });
        },
      );
    } catch (error) {
      set({
        initialized: true,
        status: "unauthenticated",
        authError: error instanceof Error ? error.message : "Falha ao carregar a sessão.",
      });
      useFinanceStore.getState().clearWorkspaceState();
      clearRealtime();
    }
  },
  setProfileMenuOpen(open) {
    set({ profileMenuOpen: open });
  },
  async completeInitialSetup({ workspaceName, theme, importDecision }) {
    const { profile, activeWorkspaceId, runtimeConfig, localImportSnapshot, userSettings } = get();
    const supabase = getSupabaseBrowserClient();
    const financeStore = useFinanceStore.getState();
    const currentSnapshot = financeStore.snapshot;

    if (!supabase || !profile || !activeWorkspaceId || !currentSnapshot) {
      return;
    }

    const nextSnapshot =
      importDecision === "merged" && localImportSnapshot
        ? mergeWorkspaceSnapshots(
            { ...currentSnapshot, workspace: { ...currentSnapshot.workspace, name: workspaceName }, settings: { ...currentSnapshot.settings, theme } },
            localImportSnapshot,
          )
        : {
            ...currentSnapshot,
            workspace: { ...currentSnapshot.workspace, name: workspaceName, updatedAt: new Date().toISOString() },
            settings: { ...currentSnapshot.settings, theme },
            meta: {
              ...currentSnapshot.meta,
              migrationOrigin:
                importDecision === "merged"
                  ? localImportSnapshot?.meta.migrationOrigin ?? "local-first-login"
                  : currentSnapshot.meta.migrationOrigin ?? "cloud-auth",
            },
          };

    const now = new Date().toISOString();

    const workspaceUpdate = supabase
      .from("workspaces")
      .update({ name: workspaceName })
      .eq("id", activeWorkspaceId);

    const settingsUpsert = supabase.from("user_settings").upsert({
      user_id: profile.id,
      active_workspace_id: activeWorkspaceId,
      theme,
      onboarding_completed: true,
      local_import_decision: importDecision,
      imported_from_local_at: importDecision === "merged" ? now : userSettings?.importedFromLocalAt ?? null,
      last_local_merge_hash: importDecision === "merged" ? `${nextSnapshot.version}:${now}` : userSettings?.lastLocalMergeHash ?? null,
    });

    const [workspaceResult, settingsResult] = await Promise.all([workspaceUpdate, settingsUpsert]);
    if (workspaceResult.error) {
      throw new Error(workspaceResult.error.message);
    }

    if (settingsResult.error) {
      throw new Error(settingsResult.error.message);
    }

    saveLocalImportDecision(profile.id, importDecision, activeWorkspaceId);

    await financeStore.hydrateWorkspace({
      config: runtimeConfig,
      snapshot: nextSnapshot,
      workspaceId: activeWorkspaceId,
      userId: profile.id,
      syncStatus: runtimeConfig.storageMode === "supabase" ? "syncing" : "local",
    });
    await financeStore.persistNow({ immediate: true });

    set((current) => ({
      onboardingOpen: false,
      localImportSnapshot: null,
      userSettings: current.userSettings
        ? {
            ...current.userSettings,
            theme,
            onboardingCompleted: true,
            localImportDecision: importDecision,
            importedFromLocalAt:
              importDecision === "merged" ? now : current.userSettings.importedFromLocalAt,
            lastLocalMergeHash:
              importDecision === "merged"
                ? `${nextSnapshot.version}:${now}`
                : current.userSettings.lastLocalMergeHash,
            updatedAt: now,
          }
        : {
            id: profile.id,
            userId: profile.id,
            activeWorkspaceId,
            theme,
            onboardingCompleted: true,
            localImportDecision: importDecision,
            importedFromLocalAt: importDecision === "merged" ? now : null,
            lastLocalMergeHash: importDecision === "merged" ? `${nextSnapshot.version}:${now}` : null,
            createdAt: now,
            updatedAt: now,
          },
      workspaces: current.workspaces.map((workspace) =>
        workspace.id === activeWorkspaceId ? { ...workspace, name: workspaceName, updatedAt: now } : workspace,
      ),
    }));
  },
  async updateThemePreference(theme) {
    const { profile, activeWorkspaceId, userSettings } = get();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) {
      return;
    }

    const { error } = await supabase.from("user_settings").upsert({
      user_id: profile.id,
      active_workspace_id: activeWorkspaceId,
      theme,
      onboarding_completed: userSettings?.onboardingCompleted ?? false,
      local_import_decision: userSettings?.localImportDecision ?? null,
      imported_from_local_at: userSettings?.importedFromLocalAt ?? null,
      last_local_merge_hash: userSettings?.lastLocalMergeHash ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    set((current) => ({
      userSettings: current.userSettings
        ? { ...current.userSettings, theme, updatedAt: new Date().toISOString() }
        : {
            id: profile.id,
            userId: profile.id,
            activeWorkspaceId,
            theme,
            onboardingCompleted: userSettings?.onboardingCompleted ?? false,
            localImportDecision: userSettings?.localImportDecision ?? null,
            importedFromLocalAt: userSettings?.importedFromLocalAt ?? null,
            lastLocalMergeHash: userSettings?.lastLocalMergeHash ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    }));
  },
  async updateProfile({ displayName, avatarUrl }) {
    const { profile, activeWorkspaceId, runtimeConfig } = get();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) {
      return;
    }

    const nextDisplayName = displayName.trim();
    if (!nextDisplayName) {
      throw new Error("Informe um nome para o perfil.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: nextDisplayName,
        avatar_url: avatarUrl?.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      throw new Error(error.message);
    }

    const nextProfile: User = {
      ...profile,
      displayName: nextDisplayName,
      avatarUrl: avatarUrl?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    const currentSnapshot = useFinanceStore.getState().snapshot;
    if (currentSnapshot && activeWorkspaceId) {
      await useFinanceStore.getState().hydrateWorkspace({
        config: runtimeConfig,
        snapshot: {
          ...currentSnapshot,
          user: nextProfile,
        },
        workspaceId: activeWorkspaceId,
        userId: nextProfile.id,
        syncStatus: runtimeConfig.storageMode === "supabase" ? "syncing" : "local",
      });
      await useFinanceStore.getState().persistNow({ immediate: true });
    }

    set({ profile: nextProfile });
  },
  async switchWorkspace(workspaceId) {
    const { profile, userSettings } = get();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) {
      return;
    }

    const { error } = await supabase.from("user_settings").upsert({
      user_id: profile.id,
      active_workspace_id: workspaceId,
      theme: userSettings?.theme ?? "dark",
      onboarding_completed: userSettings?.onboardingCompleted ?? false,
      local_import_decision: userSettings?.localImportDecision ?? null,
      imported_from_local_at: userSettings?.importedFromLocalAt ?? null,
      last_local_merge_hash: userSettings?.lastLocalMergeHash ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    set({ activeWorkspaceId: workspaceId, profileMenuOpen: false });
    await get().refresh();
  },
  async createWorkspace({ name, isPersonal }) {
    const { profile, userSettings } = get();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) {
      return;
    }

    const nextName = name.trim();
    if (nextName.length < 3) {
      throw new Error("Use pelo menos 3 caracteres no nome do workspace.");
    }

    const { data: workspaceRow, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: nextName,
        slug: buildWorkspaceSlug(nextName, profile.id),
        owner_user_id: profile.id,
        is_personal: isPersonal,
      })
      .select("id, slug, name, owner_user_id, is_personal, created_at, updated_at")
      .single();

    if (workspaceError || !workspaceRow) {
      throw new Error(workspaceError?.message ?? "Não foi possível criar o workspace.");
    }

    const { error: membershipError } = await supabase.from("workspace_members").insert({
      workspace_id: workspaceRow.id,
      user_id: profile.id,
      role: "owner",
    });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const { error: settingsError } = await supabase.from("user_settings").upsert({
      user_id: profile.id,
      active_workspace_id: workspaceRow.id,
      theme: userSettings?.theme ?? "dark",
      onboarding_completed: userSettings?.onboardingCompleted ?? false,
      local_import_decision: userSettings?.localImportDecision ?? null,
      imported_from_local_at: userSettings?.importedFromLocalAt ?? null,
      last_local_merge_hash: userSettings?.lastLocalMergeHash ?? null,
    });

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    set({ activeWorkspaceId: workspaceRow.id, profileMenuOpen: false });
    await get().refresh();
  },
  async renameWorkspace(workspaceId, name) {
    const { workspaces } = get();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const nextName = name.trim();
    if (nextName.length < 3) {
      throw new Error("Use pelo menos 3 caracteres no nome do workspace.");
    }

    const currentWorkspace = workspaces.find((item) => item.id === workspaceId);
    const { error } = await supabase
      .from("workspaces")
      .update({
        name: nextName,
        slug: currentWorkspace?.slug ?? buildWorkspaceSlug(nextName, workspaceId),
      })
      .eq("id", workspaceId);

    if (error) {
      throw new Error(error.message);
    }

    await get().refresh();
  },
  async signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearRealtime();
    useFinanceStore.getState().clearWorkspaceState();
    set({
      initialized: true,
      status: "unauthenticated",
      profile: null,
      workspaces: [],
      memberships: [],
      userSettings: null,
      activeWorkspaceId: null,
      onboardingOpen: false,
      localImportSnapshot: null,
      profileMenuOpen: false,
    });
  },
}));
