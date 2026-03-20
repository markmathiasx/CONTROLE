"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, ClipboardList, Fuel, PackagePlus, Plus, Printer, Sparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";

const quickActions = [
  { href: null, label: "Gasto / receita", icon: Sparkles, action: "quick-add" },
  { href: "/moto/abastecimentos", label: "Abastecimento", icon: Fuel, action: "link" },
  { href: "/moto/manutencoes", label: "Manutenção", icon: Wrench, action: "link" },
  { href: "/loja/catalogo", label: "Catálogo", icon: Sparkles, action: "link" },
  { href: "/loja/estoque", label: "Comprar filamento", icon: PackagePlus, action: "link" },
  { href: "/loja/estoque", label: "Novo insumo", icon: Box, action: "link" },
  { href: "/loja/producao", label: "Produção", icon: Printer, action: "link" },
  { href: "/loja/pedidos", label: "Pedido", icon: ClipboardList, action: "link" },
] as const;

export function FloatingActionButton() {
  const pathname = usePathname();
  const setQuickAddOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);

  const closeSpeedDial = React.useCallback(() => {
    setSpeedDialOpen(false);
  }, []);

  const scheduleAutoClose = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      closeSpeedDial();
    }, 12_000);
  }, [closeSpeedDial]);

  React.useEffect(() => {
    closeSpeedDial();
  }, [closeSpeedDial, pathname]);

  React.useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!speedDialOpen) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      return;
    }

    scheduleAutoClose();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        scheduleAutoClose();
        return;
      }
      closeSpeedDial();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSpeedDial();
        return;
      }
      scheduleAutoClose();
    };

    const handleScrollIntent = () => closeSpeedDial();

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollIntent, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollIntent, true);
    };
  }, [closeSpeedDial, scheduleAutoClose, speedDialOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-2 sm:right-8">
      {speedDialOpen ? (
        <div
          id="quick-actions-speed-dial"
          className="flex w-[16.5rem] flex-col gap-2 rounded-[2rem] border border-white/10 bg-black/80 p-3 shadow-[0_24px_80px_-30px_rgba(16,185,129,1)] backdrop-blur-xl"
        >
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
        aria-expanded={speedDialOpen}
        aria-controls="quick-actions-speed-dial"
        onClick={() => {
          const next = !speedDialOpen;
          setSpeedDialOpen(next);
          if (next) {
            scheduleAutoClose();
          }
        }}
      >
        <Plus className={cn("size-6 transition", speedDialOpen && "rotate-45")} />
        <span className="sr-only">Abrir ações rápidas</span>
      </Button>
    </div>
  );
}
