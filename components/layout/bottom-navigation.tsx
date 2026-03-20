"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, FolderKanban, House, LayoutGrid, Printer, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";

const primaryItems = [
  { href: "/", label: "Resumo", icon: House },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/moto", label: "Veículos", icon: Bike },
  { href: "/loja", label: "Loja", icon: Printer },
] as const;

const secondaryItems = [
  { href: "/transacoes", label: "Transações" },
  { href: "/loja/catalogo", label: "Catálogo" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/parcelas", label: "Parcelas" },
  { href: "/categorias", label: "Categorias" },
  { href: "/orcamentos", label: "Orçamentos" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const moreMenuOpen = useFinanceStore((state) => state.moreMenuOpen);
  const setMoreMenuOpen = useFinanceStore((state) => state.setMoreMenuOpen);

  function isActivePath(href: string) {
    if (href === "/") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-black/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                  active ? "bg-emerald-400/14 text-emerald-200" : "text-zinc-500",
                )}
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
              secondaryItems.some((item) => isActivePath(item.href))
                ? "bg-emerald-400/14 text-emerald-200"
                : "text-zinc-500",
            )}
          >
            <LayoutGrid className="size-4" />
            <span className="truncate">Mais</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Mais seções</SheetTitle>
            <SheetDescription>
              Acesso rápido para operação financeira e configurações do hub.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-3">
            {secondaryItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="secondary"
                className="h-12 justify-start rounded-2xl"
                onClick={() => setMoreMenuOpen(false)}
              >
                <Link href={item.href}>
                  <FolderKanban className="size-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
