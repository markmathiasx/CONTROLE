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
  const draftStorageKey = `mmsvh:quick-add-draft:${compact ? "compact" : "full"}`;
  const quickExamples = React.useMemo(
    () => [
      "30 credito cigarro",
      "42 pix bebida namorada",
      "78 debito gasolina carro",
      "300 credito 3x mercado casal",
    ],
    [],
  );

  const defaultCenterId =
    snapshot?.costCenters.find((center) => center.kind === "me")?.id ??
    snapshot?.costCenters[0]?.id ??
    "";

  const handleParse = React.useCallback(() => {
    if (!snapshot) {
      setParsed(null);
      return;
    }

    const next = parseQuickEntry(raw, {
      cards: snapshot.cards.filter((card) => card.active),
      categories: snapshot.categories.filter((category) => !category.archivedAt),
      costCenters: snapshot.costCenters,
      defaultCenterId,
    });
    setParsed(next);
  }, [defaultCenterId, raw, snapshot]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedDraft = window.localStorage.getItem(draftStorageKey);
    if (savedDraft) {
      setRaw(savedDraft);
    }
  }, [draftStorageKey]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!raw.trim()) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    window.localStorage.setItem(draftStorageKey, raw);
  }, [draftStorageKey, raw]);

  React.useEffect(() => {
    if (!snapshot) {
      return;
    }

    if (!raw.trim()) {
      setParsed(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      handleParse();
    }, 320);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [handleParse, raw, snapshot]);

  if (!snapshot) {
    return null;
  }

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
        <div className="flex flex-wrap gap-2">
          {quickExamples.map((example) => (
            <button
              key={example}
              type="button"
              className="liquid-chip interactive-surface rounded-full px-3 py-1.5 text-xs text-zinc-200"
              onClick={() => setRaw(example)}
            >
              {example}
            </button>
          ))}
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
              if (typeof window !== "undefined") {
                window.localStorage.removeItem(draftStorageKey);
              }
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
