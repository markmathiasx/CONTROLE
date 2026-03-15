"use client";

import * as React from "react";
import { CloudAlert, CloudOff, RefreshCcw, WifiOff } from "lucide-react";

import { useFinanceStore } from "@/store/use-finance-store";

export function ConnectivityBanner() {
  const storageMode = useFinanceStore((state) => state.runtimeConfig.storageMode);
  const syncStatus = useFinanceStore((state) => state.syncStatus);
  const dirty = useFinanceStore((state) => state.snapshot?.meta.dirty ?? false);
  const [isOffline, setIsOffline] = React.useState(false);

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
        <span className="inline-flex items-center gap-2">
          <WifiOff className="size-3.5" />
          {storageMode === "supabase"
            ? "Você está offline. O app segue no cache local e reenvia quando a conexão voltar."
            : "Você está offline, mas o modo local continua funcionando neste aparelho."}
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
      <div className="border-b border-rose-400/15 bg-rose-400/10 px-4 py-2 text-center text-xs text-rose-100">
        <span className="inline-flex items-center gap-2">
          <CloudAlert className="size-3.5" />
          A última sincronização falhou. Seus dados seguem no cache local até a próxima tentativa.
        </span>
      </div>
    );
  }

  if (dirty && syncStatus !== "syncing" && syncStatus !== "synced") {
    return (
      <div className="border-b border-cyan-400/10 bg-cyan-400/8 px-4 py-2 text-center text-xs text-cyan-100">
        <span className="inline-flex items-center gap-2">
          <RefreshCcw className="size-3.5" />
          Alterações locais aguardando envio para a nuvem.
        </span>
      </div>
    );
  }

  return null;
}
