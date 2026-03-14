"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/providers/theme-provider";
import type { RuntimeConfig } from "@/types/domain";
import { useFinanceStore } from "@/store/use-finance-store";

function Bootstrapper({ runtimeConfig }: { runtimeConfig: RuntimeConfig }) {
  const bootstrap = useFinanceStore((state) => state.bootstrap);
  const initialized = useFinanceStore((state) => state.initialized);
  const snapshotTheme = useFinanceStore((state) => state.snapshot?.settings.theme ?? "dark");
  const { setTheme } = useTheme();

  React.useEffect(() => {
    void bootstrap(runtimeConfig);
  }, [bootstrap, runtimeConfig]);

  React.useEffect(() => {
    if (initialized) {
      setTheme(snapshotTheme);
    }
  }, [initialized, setTheme, snapshotTheme]);

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
      {children}
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
