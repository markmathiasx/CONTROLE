"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { QuickAddModal } from "@/components/shared/quick-add-modal";
import type { RuntimeConfig } from "@/types/domain";
import { useAuthStore } from "@/store/use-auth-store";

export function AppShell({
  children,
  runtimeConfig,
}: {
  children: React.ReactNode;
  runtimeConfig: RuntimeConfig;
}) {
  const pathname = usePathname();
  const authStatus = useAuthStore((state) => state.status);
  const authInitialized = useAuthStore((state) => state.initialized);

  const isAuthRoute = ["/unlock", "/login", "/cadastro", "/logout"].some((route) =>
    pathname.startsWith(route),
  );
  const shouldRenderPublicShellLess =
    runtimeConfig.hasSupabase &&
    (isAuthRoute || pathname === "/") &&
    (!authInitialized || authStatus !== "authenticated");

  if (isAuthRoute || shouldRenderPublicShellLess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#052e2b_0%,rgba(5,46,43,0.35)_20%,transparent_45%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.18),transparent_34%),#030712]">
      <a href="#app-shell-main" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <AppHeader />
      <ConnectivityBanner />
      <main
        id="app-shell-main"
        className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-6xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-5 sm:px-6"
      >
        {children}
      </main>
      <FloatingActionButton />
      <BottomNavigation />
      <QuickAddModal />
    </div>
  );
}
