"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { toast } from "sonner";

import { AuthOnboardingDialog } from "@/components/providers/auth-onboarding-dialog";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { RuntimeConfig } from "@/types/domain";
import { useAuthStore } from "@/store/use-auth-store";
import { useFinanceStore } from "@/store/use-finance-store";

function Bootstrapper({ runtimeConfig }: { runtimeConfig: RuntimeConfig }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const authInitialized = useAuthStore((state) => state.initialized);
  const authTheme = useAuthStore((state) => state.userSettings?.theme ?? null);
  const snapshotTheme = useFinanceStore((state) => state.snapshot?.settings.theme ?? "dark");
  const { setTheme } = useTheme();

  React.useEffect(() => {
    void bootstrap(runtimeConfig);
  }, [bootstrap, runtimeConfig]);

  React.useEffect(() => {
    if (authInitialized) {
      setTheme(authTheme ?? snapshotTheme);
    }
  }, [authInitialized, authTheme, setTheme, snapshotTheme]);

  return null;
}

function SyncRecovery() {
  const authStatus = useAuthStore((state) => state.status);
  const syncStatus = useFinanceStore((state) => state.syncStatus);
  const syncError = useFinanceStore((state) => state.syncError);
  const snapshot = useFinanceStore((state) => state.snapshot);
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const persistNow = useFinanceStore((state) => state.persistNow);
  const lastAttemptRef = React.useRef(0);
  const previousSyncStatusRef = React.useRef(syncStatus);

  React.useEffect(() => {
    if (runtimeConfig.storageMode !== "supabase" || authStatus !== "authenticated") {
      previousSyncStatusRef.current = syncStatus;
      return;
    }

    if (previousSyncStatusRef.current !== syncStatus) {
      if (syncStatus === "error") {
        toast.error(syncError ?? "A nuvem falhou por enquanto. Seus dados continuam no cache local.");
      }

      if (previousSyncStatusRef.current === "error" && syncStatus === "synced") {
        toast.success("Sincronização normalizada.");
      }
    }

    previousSyncStatusRef.current = syncStatus;
  }, [authStatus, runtimeConfig.storageMode, syncError, syncStatus]);

  React.useEffect(() => {
    if (runtimeConfig.storageMode !== "supabase" || authStatus !== "authenticated") {
      return;
    }

    const attemptSync = () => {
      const now = Date.now();
      const currentState = useFinanceStore.getState();
      const currentAuthState = useAuthStore.getState();

      if (document.visibilityState === "hidden") {
        return;
      }

      if (currentAuthState.status !== "authenticated") {
        return;
      }

      if (!currentState.snapshot?.meta.dirty && currentState.syncStatus !== "error") {
        return;
      }

      if (now - lastAttemptRef.current < 2500) {
        return;
      }

      lastAttemptRef.current = now;
      void currentState.persistNow({ immediate: true });
    };

    const interval = window.setInterval(attemptSync, 30000);
    window.addEventListener("focus", attemptSync);
    window.addEventListener("online", attemptSync);
    document.addEventListener("visibilitychange", attemptSync);

    if (snapshot?.meta.dirty || syncStatus === "error") {
      attemptSync();
    }

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", attemptSync);
      window.removeEventListener("online", attemptSync);
      document.removeEventListener("visibilitychange", attemptSync);
    };
  }, [authStatus, persistNow, runtimeConfig.storageMode, snapshot?.meta.dirty, syncStatus]);

  return null;
}

function ConnectivityFeedback() {
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const notifyOffline = () => {
      if (!mountedRef.current) {
        return;
      }

      toast("Sem conexão agora. O app continua usando o cache local deste aparelho.");
    };

    const notifyOnline = () => {
      if (!mountedRef.current) {
        return;
      }

      toast.success(
        runtimeConfig.storageMode === "supabase"
          ? "Conexão restaurada. A sincronização será retomada."
          : "Conexão restaurada.",
      );
    };

    mountedRef.current = true;
    window.addEventListener("offline", notifyOffline);
    window.addEventListener("online", notifyOnline);

    return () => {
      window.removeEventListener("offline", notifyOffline);
      window.removeEventListener("online", notifyOnline);
    };
  }, [runtimeConfig.storageMode]);

  return null;
}

export function Providers({
  children,
  runtimeConfig,
}: {
  children: React.ReactNode;
  runtimeConfig: RuntimeConfig;
}) {
  return (
    <ThemeProvider>
      <Bootstrapper runtimeConfig={runtimeConfig} />
      <SyncRecovery />
      <ConnectivityFeedback />
      {children}
      <AuthOnboardingDialog />
      <Toaster
        position="top-center"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(9,9,11,0.95)",
            color: "#fafafa",
          },
        }}
      />
    </ThemeProvider>
  );
}
