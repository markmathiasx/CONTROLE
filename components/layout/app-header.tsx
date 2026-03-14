"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, CloudOff, DatabaseZap, LockKeyhole, Printer, Sparkles, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { appName } from "@/lib/constants";
import { useFinanceStore } from "@/store/use-finance-store";

const pageTitles: Record<string, string> = {
  "/": "Hub consolidado",
  "/financeiro": "Dashboard financeiro",
  "/moto": "Dashboard da moto",
  "/moto/abastecimentos": "Abastecimentos",
  "/moto/manutencoes": "Manutenções",
  "/loja": "Dashboard da loja",
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

export function AppHeader() {
  const pathname = usePathname();
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const syncStatus = useFinanceStore((state) => state.syncStatus);
  const navPills = [
    { href: "/financeiro", label: "Financeiro", icon: Wallet },
    { href: "/moto", label: "Moto", icon: Bike },
    { href: "/loja", label: "Loja", icon: Printer },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-2">
              <Sparkles className="size-4 text-emerald-300" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold text-zinc-50">{appName}</p>
              <p className="text-sm text-zinc-400">{pageTitles[pathname] ?? "Controle financeiro"}</p>
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
          <Badge variant={syncStatus === "error" ? "danger" : runtimeConfig.storageMode === "supabase" ? "default" : "warning"}>
            {runtimeConfig.storageMode === "supabase" ? (
              <DatabaseZap className="mr-1 size-3.5" />
            ) : (
              <CloudOff className="mr-1 size-3.5" />
            )}
            {syncStatus === "error"
              ? "Sync pendente"
              : runtimeConfig.storageMode === "supabase"
                ? "Supabase"
              : "Modo local"}
          </Badge>
        </div>

        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          {navPills.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
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
  );
}
