"use client";

import * as React from "react";
import { CloudAlert, CloudOff, RefreshCcw, WifiOff } from "lucide-react";

import { useFinanceStore } from "@/store/use-finance-store";
import { Button } from "@/components/ui/button";

export function ConnectivityBanner() {
  const storageMode = useFinanceStore((state) => state.runtimeConfig.storageMode);
  const syncStatus = useFinanceStore((state) => state.syncStatus);
  const syncError = useFinanceStore((state) => state.syncError);
  const dirty = useFinanceStore((state) => state.snapshot?.meta.dirty ?? false);
  const lastSyncedAt = useFinanceStore((state) => state.snapshot?.meta.lastSyncedAt ?? null);
  const persistNow = useFinanceStore((state) => state.persistNow);
  const [isOffline, setIsOffline] = React.useState(false);

  const lastSyncedLabel = React.useMemo(() => {
    if (!lastSyncedAt) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(lastSyncedAt));
    } catch {
      return null;
    }
  }, [lastSyncedAt]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const update = () => setIsOffline(!window.navigator.onLine);
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="border-b border-amber-400/15 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-100">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <WifiOff className="size-3.5" />
          {storageMode === "supabase"
            ? "Você está offline. O app segue no cache local e reenvia quando a conexão voltar."
            : "Você está offline, mas o modo local continua funcionando neste aparelho."}
          {lastSyncedLabel ? (
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-50">
              Última sync {lastSyncedLabel}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  if (storageMode === "local") {
    return (
      <div className="border-b border-amber-400/10 bg-amber-400/8 px-4 py-2 text-center text-xs text-amber-100">
        <span className="inline-flex items-center gap-2">
          <CloudOff className="size-3.5" />
          Modo local ativo. Seus dados ficam neste aparelho até você configurar o Supabase.
        </span>
      </div>
    );
  }

  if (syncStatus === "error") {
    return (
      <div className="border-b border-rose-400/15 bg-rose-400/10 px-4 py-2 text-xs text-rose-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-center sm:justify-between sm:text-left">
          <span className="inline-flex flex-wrap items-center gap-2">
            <CloudAlert className="size-3.5" />
            {syncError ??
              "A última sincronização falhou. Seus dados seguem no cache local até a próxima tentativa."}
            {lastSyncedLabel ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rose-50">
                Última sync {lastSyncedLabel}
              </span>
            ) : null}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 rounded-full px-3 text-[11px]"
            onClick={() => void persistNow({ immediate: true })}
          >
            <RefreshCcw className="size-3.5" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (dirty && (syncStatus === "queued" || syncStatus === "idle")) {
    return (
      <div className="border-b border-cyan-400/10 bg-cyan-400/8 px-4 py-2 text-center text-xs text-cyan-100">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <RefreshCcw className="size-3.5" />
          Alterações locais aguardando envio para a nuvem.
          {lastSyncedLabel ? (
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-50">
              Última sync {lastSyncedLabel}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  return null;
}
