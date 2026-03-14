"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { EntryForm } from "@/components/shared/entry-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseQuickEntry } from "@/utils/quick-entry";
import { useFinanceStore } from "@/store/use-finance-store";

export function QuickAddPanel({
  compact = false,
  onSaved,
}: {
  compact?: boolean;
  onSaved?: () => void;
}) {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const [raw, setRaw] = React.useState("");
  const [parsed, setParsed] = React.useState<ReturnType<typeof parseQuickEntry> | null>(
    null,
  );

  if (!snapshot) {
    return null;
  }

  const defaultCenterId =
    snapshot.costCenters.find((center) => center.kind === "me")?.id ??
    snapshot.costCenters[0]?.id ??
    "";

  const handleParse = () => {
    const next = parseQuickEntry(raw, {
      cards: snapshot.cards.filter((card) => card.active),
      categories: snapshot.categories.filter((category) => !category.archivedAt),
      costCenters: snapshot.costCenters,
      defaultCenterId,
    });
    setParsed(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Lançamento rápido por texto</Label>
        <div className="flex gap-2">
          <Input
            placeholder='Ex.: 300 credito 3x mercado casal'
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />
          <Button onClick={handleParse} type="button" variant="secondary">
            <Sparkles className="size-4" />
            Interpretar
          </Button>
        </div>
      </div>

      {parsed ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="muted">Texto: {parsed.rawText}</Badge>
            {parsed.warnings.length ? (
              parsed.warnings.map((warning) => (
                <Badge key={warning} variant="warning">
                  {warning}
                </Badge>
              ))
            ) : (
              <Badge>Interpretado com sucesso</Badge>
            )}
          </div>

          <EntryForm
            initialValues={{
              kind: parsed.kind,
              description: parsed.description,
              amount: parsed.amount ?? 0,
              date: parsed.transactionDate,
              centerId: parsed.centerId,
              categoryId: parsed.categoryId ?? snapshot.categories[0]?.id,
              paymentMethod: parsed.paymentMethod,
              cardId: parsed.cardId ?? snapshot.cards[0]?.id,
              installments: parsed.installments,
            }}
            centers={snapshot.costCenters}
            categories={snapshot.categories}
            cards={snapshot.cards}
            submitLabel={compact ? "Salvar lançamento" : "Confirmar lançamento rápido"}
            onSaved={() => {
              setRaw("");
              setParsed(null);
              onSaved?.();
            }}
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          Digite como você fala no dia a dia. O app interpreta e deixa você revisar antes de salvar.
        </p>
      )}
    </div>
  );
}
