"use client";

import * as React from "react";

import { QuickAddPanel } from "@/components/shared/quick-add-panel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinanceStore } from "@/store/use-finance-store";

export function QuickAddModal() {
  const open = useFinanceStore((state) => state.quickAddOpen);
  const setOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!open) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      return;
    }

    const scheduleClose = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 24_000);
    };

    const onActivity = () => scheduleClose();

    scheduleClose();
    window.addEventListener("pointerdown", onActivity, true);
    window.addEventListener("keydown", onActivity, true);

    return () => {
      window.removeEventListener("pointerdown", onActivity, true);
      window.removeEventListener("keydown", onActivity, true);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [open, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançamento rápido</DialogTitle>
          <DialogDescription>
            Digite algo como “42 pix bebida namorada” e revise antes de salvar.
          </DialogDescription>
        </DialogHeader>
        <QuickAddPanel onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
