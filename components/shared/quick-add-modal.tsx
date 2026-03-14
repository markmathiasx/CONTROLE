"use client";

import { QuickAddPanel } from "@/components/shared/quick-add-panel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinanceStore } from "@/store/use-finance-store";

export function QuickAddModal() {
  const open = useFinanceStore((state) => state.quickAddOpen);
  const setOpen = useFinanceStore((state) => state.setQuickAddOpen);

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
