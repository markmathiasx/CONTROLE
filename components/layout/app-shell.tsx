"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { QuickAddModal } from "@/components/shared/quick-add-modal";
import { useFinanceStore } from "@/store/use-finance-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);

  if (pathname.startsWith("/unlock")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#052e2b_0%,rgba(5,46,43,0.35)_20%,transparent_45%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.18),transparent_34%),#030712]">
      <AppHeader />
      {runtimeConfig.storageMode === "local" ? (
        <div className="border-b border-amber-400/10 bg-amber-400/8 px-4 py-2 text-center text-xs text-amber-100">
          Modo local ativo. Seus dados ficam neste aparelho até você configurar o Supabase.
        </div>
      ) : null}
      <main className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6">
        {children}
      </main>
      <FloatingActionButton />
      <BottomNavigation />
      <QuickAddModal />
    </div>
  );
}
