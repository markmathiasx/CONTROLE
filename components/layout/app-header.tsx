"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bike,
  CheckCheck,
  CloudOff,
  DatabaseZap,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Printer,
  RefreshCw,
  Sparkles,
  Users,
  UserCircle2,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { appName } from "@/lib/constants";
import { useAuthStore } from "@/store/use-auth-store";
import { useFinanceStore } from "@/store/use-finance-store";
import { getWorkspaceKindLabel } from "@/utils/workspaces";

const pageTitles: Record<string, string> = {
  "/": "Hub consolidado",
  "/financeiro": "Dashboard financeiro",
  "/moto": "Dashboard do automóvel",
  "/moto/abastecimentos": "Abastecimentos",
  "/moto/manutencoes": "Manutenções",
  "/loja": "Dashboard da loja",
  "/loja/catalogo": "Catálogo da loja",
  "/loja/estoque": "Estoque da loja",
  "/loja/producao": "Produção 3D",
  "/loja/pedidos": "Pedidos da loja",
  "/transacoes": "Transações",
  "/transacoes/nova": "Novo lançamento",
  "/cartoes": "Cartões",
  "/parcelas": "Parcelas futuras",
  "/categorias": "Categorias",
  "/orcamentos": "Orçamentos",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const syncStatus = useFinanceStore((state) => state.syncStatus);
  const persistNow = useFinanceStore((state) => state.persistNow);
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);
  const workspaces = useAuthStore((state) => state.workspaces);
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const profileMenuOpen = useAuthStore((state) => state.profileMenuOpen);
  const setProfileMenuOpen = useAuthStore((state) => state.setProfileMenuOpen);
  const switchWorkspace = useAuthStore((state) => state.switchWorkspace);
  const signOut = useAuthStore((state) => state.signOut);
  const [busyWorkspaceId, setBusyWorkspaceId] = React.useState<string | null>(null);

  const navPills = [
    { href: "/financeiro", label: "Financeiro", icon: Wallet },
    { href: "/moto", label: "Veículos", icon: Bike },
    { href: "/loja", label: "Loja", icon: Printer },
  ] as const;

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null;

  const syncBadge = React.useMemo(() => {
    if (runtimeConfig.storageMode === "local") {
      return {
        label: "Modo local",
        icon: CloudOff,
        variant: "warning" as const,
      };
    }

    if (syncStatus === "error") {
      return {
        label: "Erro de sync",
        icon: XCircle,
        variant: "danger" as const,
      };
    }

    if (syncStatus === "syncing") {
      return {
        label: "Sincronizando",
        icon: LoaderCircle,
        variant: "default" as const,
      };
    }

    if (syncStatus === "synced") {
      return {
        label: "Sincronizado",
        icon: CheckCheck,
        variant: "default" as const,
      };
    }

    return {
      label: "Nuvem",
      icon: DatabaseZap,
      variant: "default" as const,
    };
  }, [runtimeConfig.storageMode, syncStatus]);

  const SyncIcon = syncBadge.icon;
  const displayName = profile?.displayName ?? profile?.username ?? "Seu perfil";
  const initials = getInitials(displayName);

  React.useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname, setProfileMenuOpen]);

  React.useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const closeByIdle = window.setTimeout(() => {
      setProfileMenuOpen(false);
    }, 25_000);

    return () => {
      window.clearTimeout(closeByIdle);
    };
  }, [profileMenuOpen, setProfileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/8 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <Link href="/" prefetch={false} className="inline-flex items-center gap-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-2">
                <Sparkles className="size-4 text-emerald-300" />
              </div>
              <div>
                <p className="font-heading text-base font-semibold text-zinc-50">{appName}</p>
                <p className="text-sm text-zinc-400">{pageTitles[pathname] ?? "Controle pessoal"}</p>
              </div>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {runtimeConfig.hasPinLock ? (
              <Badge variant="muted">
                <LockKeyhole className="mr-1 size-3.5" />
                Protegido
              </Badge>
            ) : null}
            <Badge variant={syncBadge.variant}>
              <SyncIcon
                className={`mr-1 size-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
              />
              {syncBadge.label}
            </Badge>
            {runtimeConfig.hasSupabase && status === "authenticated" ? (
              <button
                type="button"
                aria-label="Abrir menu da conta e do workspace"
                onClick={() => setProfileMenuOpen(true)}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-2.5 py-1.5 text-left transition hover:bg-white/10"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/80 to-cyan-400/70 text-xs font-semibold text-zinc-950">
                  {initials || "U"}
                </div>
                <div className="hidden min-w-0 md:block">
                  <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
                  <p className="truncate text-xs text-zinc-400">
                    @{profile?.username} • {activeWorkspace?.name ?? "Workspace"}
                  </p>
                </div>
              </button>
            ) : null}
          </div>

          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
            {navPills.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-200"
                      : "border-white/8 bg-white/5 text-zinc-400"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <Sheet open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Conta e sincronização</SheetTitle>
            <SheetDescription>
              Perfil logado, workspace ativo e status da nuvem neste dispositivo.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/90 to-cyan-400/80 text-sm font-semibold text-zinc-950">
                  {initials || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-50">{displayName}</p>
                  <p className="truncate text-sm text-zinc-400">
                    {profile?.email ?? `@${profile?.username ?? "local"}`}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Login</p>
                  <p className="mt-1 text-zinc-100">@{profile?.username ?? "modo-local"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Workspace</p>
                  <p className="mt-1 text-zinc-100">{activeWorkspace?.name ?? "Local neste aparelho"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {runtimeConfig.storageMode === "supabase" && workspaces.length > 1 ? (
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-50">Trocar contexto</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {workspaces.map((workspace) => {
                      const isActive = workspace.id === activeWorkspaceId;

                      return (
                        <button
                          key={workspace.id}
                          type="button"
                          aria-pressed={isActive}
                          disabled={busyWorkspaceId === workspace.id}
                          className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                            isActive
                              ? "border-emerald-400/30 bg-emerald-400/10"
                              : "border-white/8 bg-black/20 hover:bg-white/6"
                          }`}
                          onClick={async () => {
                            if (isActive) {
                              return;
                            }

                            try {
                              setBusyWorkspaceId(workspace.id);
                              await switchWorkspace(workspace.id);
                              router.refresh();
                              toast.success(`Contexto alterado para ${workspace.name}.`);
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Não foi possível trocar de workspace.",
                              );
                            } finally {
                              setBusyWorkspaceId(null);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-100">
                                {workspace.name}
                              </p>
                              <p className="truncate text-xs text-zinc-400">
                                {getWorkspaceKindLabel(workspace.isPersonal)}
                              </p>
                            </div>
                            <Badge variant={isActive ? "default" : "muted"}>
                              {isActive
                                ? "Ativo"
                                : busyWorkspaceId === workspace.id
                                  ? "Abrindo..."
                                  : "Abrir"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <p className="text-sm font-medium text-zinc-50">Status da sincronização</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {runtimeConfig.storageMode === "local"
                    ? "Seus dados estão salvos apenas neste navegador."
                    : syncStatus === "error"
                      ? "A última tentativa falhou. Seus dados continuam no cache local e podem ser reenviados."
                      : syncStatus === "syncing"
                        ? "As alterações recentes estão sendo enviadas para a nuvem."
                        : "Seu workspace está pronto para continuar no celular e no desktop."}
                </p>
              </div>

              {runtimeConfig.storageMode === "supabase" ? (
                <Button
                  variant="secondary"
                  className="justify-start rounded-2xl"
                  onClick={async () => {
                    try {
                      await persistNow();
                      toast.success("Sincronização disparada novamente.");
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Não foi possível sincronizar agora.",
                      );
                    }
                  }}
                >
                  <RefreshCw className="size-4" />
                  Tentar sincronizar novamente
                </Button>
              ) : null}

              <Button asChild variant="secondary" className="justify-start rounded-2xl">
                <Link href="/configuracoes" prefetch={false} onClick={() => setProfileMenuOpen(false)}>
                  <UserCircle2 className="size-4" />
                  Abrir configurações
                </Link>
              </Button>

              {runtimeConfig.hasSupabase && status === "authenticated" ? (
                <Button
                  variant="destructive"
                  className="justify-start rounded-2xl"
                  onClick={async () => {
                    try {
                      await signOut();
                      setProfileMenuOpen(false);
                      router.replace("/login");
                      router.refresh();
                      toast.success("Sessão encerrada.");
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Não foi possível sair agora.",
                      );
                    }
                  }}
                >
                  <LogOut className="size-4" />
                  Sair
                </Button>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
