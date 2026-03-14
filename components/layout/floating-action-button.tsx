"use client";

import * as React from "react";
import Link from "next/link";
import { Box, ClipboardList, Fuel, PackagePlus, Plus, Printer, Sparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";

const quickActions = [
  { href: null, label: "Gasto / receita", icon: Sparkles, action: "quick-add" },
  { href: "/moto/abastecimentos", label: "Abastecimento", icon: Fuel, action: "link" },
  { href: "/moto/manutencoes", label: "Manutenção", icon: Wrench, action: "link" },
  { href: "/loja/estoque", label: "Comprar filamento", icon: PackagePlus, action: "link" },
  { href: "/loja/estoque", label: "Novo insumo", icon: Box, action: "link" },
  { href: "/loja/producao", label: "Produção", icon: Printer, action: "link" },
  { href: "/loja/pedidos", label: "Pedido", icon: ClipboardList, action: "link" },
] as const;

export function FloatingActionButton() {
  const setQuickAddOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);

  return (
    <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-2 sm:right-8">
      {speedDialOpen ? (
        <div className="flex w-[16.5rem] flex-col gap-2 rounded-[2rem] border border-white/10 bg-black/80 p-3 shadow-[0_24px_80px_-30px_rgba(16,185,129,1)] backdrop-blur-xl">
          {quickActions.map((item) => {
            const Icon = item.icon;

            if (item.action === "quick-add") {
              return (
                <Button
                  key={item.label}
                  variant="secondary"
                  className="justify-start rounded-2xl"
                  onClick={() => {
                    setSpeedDialOpen(false);
                    setQuickAddOpen(true);
                  }}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            }

            return (
              <Button
                key={item.label}
                asChild
                variant="secondary"
                className="justify-start rounded-2xl"
                onClick={() => setSpeedDialOpen(false)}
              >
                <Link href={item.href}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      ) : null}

      <Button
        size="icon"
        className={cn(
          "size-14 rounded-full shadow-[0_24px_80px_-30px_rgba(16,185,129,1)]",
          speedDialOpen && "bg-zinc-800 hover:bg-zinc-700",
        )}
        onClick={() => setSpeedDialOpen(!speedDialOpen)}
      >
        <Plus className={cn("size-6 transition", speedDialOpen && "rotate-45")} />
        <span className="sr-only">Abrir ações rápidas</span>
      </Button>
    </div>
  );
}
