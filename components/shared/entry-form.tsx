"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { incomeTypeLabels, paymentMethodLabels } from "@/lib/constants";
import type { Category, CostCenter, CreditCard } from "@/types/domain";
import type { EntryFormValues } from "@/types/forms";
import { useFinanceStore } from "@/store/use-finance-store";

const formSchema = z
  .object({
    id: z.string().optional(),
    kind: z.enum(["expense", "income"]),
    description: z.string().min(2, "Descreva o lançamento."),
    amount: z.coerce.number().positive("Informe um valor maior que zero."),
    date: z.string().min(1, "Escolha a data."),
    centerId: z.string().min(1, "Selecione um centro."),
    categoryId: z.string().optional(),
    paymentMethod: z.enum(["cash", "pix", "debit", "credit", "vr"]),
    cardId: z.string().optional(),
    installments: z.coerce.number().int().min(1).max(24),
    notes: z.string().optional(),
    incomeType: z.enum(["salary", "vr", "freelance", "reimbursement", "sale", "other"]),
    wallet: z.enum(["cash", "vr"]),
    recurrenceFrequency: z.enum(["none", "weekly", "monthly", "yearly"]),
    recurrenceEndDate: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "expense" && !value.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Selecione uma categoria.",
      });
    }

    if (value.kind === "expense" && value.paymentMethod === "credit" && !value.cardId) {
      ctx.addIssue({
        code: "custom",
        path: ["cardId"],
        message: "Selecione um cartão para compras no crédito.",
      });
    }
  });

type EntryFormSchemaInput = z.input<typeof formSchema>;
type EntryFormSchemaOutput = z.output<typeof formSchema>;

const defaultValues: EntryFormValues = {
  kind: "expense",
  description: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  centerId: "",
  categoryId: "",
  paymentMethod: "debit",
  cardId: "",
  installments: 1,
  notes: "",
  incomeType: "salary",
  wallet: "cash",
  recurrenceFrequency: "none",
};

export function EntryForm({
  initialValues,
  centers,
  categories,
  cards,
  onSaved,
  submitLabel = "Salvar lançamento",
}: {
  initialValues?: Partial<EntryFormSchemaInput>;
  centers: CostCenter[];
  categories: Category[];
  cards: CreditCard[];
  onSaved?: () => void;
  submitLabel?: string;
}) {
  const saveEntry = useFinanceStore((state) => state.saveEntry);

  const form = useForm<EntryFormSchemaInput, undefined, EntryFormSchemaOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      centerId: centers.find((center) => center.kind === "me")?.id ?? centers[0]?.id ?? "",
      categoryId: categories[0]?.id ?? "",
      cardId: cards[0]?.id ?? "",
      ...initialValues,
    },
  });

  const kind = useWatch({
    control: form.control,
    name: "kind",
  });
  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });
  const recurrenceFrequency = useWatch({
    control: form.control,
    name: "recurrenceFrequency",
  });

  React.useEffect(() => {
    if (kind === "income") {
      form.setValue("paymentMethod", "pix");
      form.setValue("installments", 1);
    }
  }, [form, kind]);

  const handleSubmit = form.handleSubmit((values) => {
    saveEntry(values as unknown as EntryFormValues);
    toast.success(values.kind === "expense" ? "Gasto salvo" : "Receita salva");
    onSaved?.();
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>Tipo de lançamento</Label>
        <Controller
          control={form.control}
          name="kind"
          render={({ field }) => (
            <Tabs value={field.value} onValueChange={(value) => field.onChange(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense">Gasto</TabsTrigger>
                <TabsTrigger value="income">Receita</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" placeholder="Ex.: mercado da semana" {...form.register("description")} />
          <p className="text-xs text-rose-300">{form.formState.errors.description?.message}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" type="number" step="0.01" inputMode="decimal" {...form.register("amount")} />
          <p className="text-xs text-rose-300">{form.formState.errors.amount?.message}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" {...form.register("date")} />
          <p className="text-xs text-rose-300">{form.formState.errors.date?.message}</p>
        </div>

        <div className="space-y-2">
          <Label>Centro</Label>
          <Controller
            control={form.control}
            name="centerId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um centro" />
                </SelectTrigger>
                <SelectContent>
                  {centers
                    .filter((center) => center.active)
                    .map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-rose-300">{form.formState.errors.centerId?.message}</p>
        </div>

        {kind === "expense" ? (
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => !category.archivedAt)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-rose-300">{form.formState.errors.categoryId?.message}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Tipo de receita</Label>
            <Controller
              control={form.control}
              name="incomeType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(incomeTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {kind === "expense" ? (
          <div className="space-y-2">
            <Label>Pagamento</Label>
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Carteira</Label>
            <Controller
              control={form.control}
              name="wallet"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro/Conta</SelectItem>
                    <SelectItem value="vr">VR</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {kind === "expense" && paymentMethod === "credit" ? (
          <>
            <div className="space-y-2">
              <Label>Cartão</Label>
              <Controller
                control={form.control}
                name="cardId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards
                        .filter((card) => card.active)
                        .map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name} •••• {card.last4}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-rose-300">{form.formState.errors.cardId?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Input id="installments" type="number" min={1} max={24} {...form.register("installments")} />
            </div>
          </>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label>Recorrência</Label>
          <Controller
            control={form.control}
            name="recurrenceFrequency"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Não recorrente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não recorrente</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {recurrenceFrequency !== "none" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="recurrenceEndDate">Encerrar em</Label>
            <Input id="recurrenceEndDate" type="date" {...form.register("recurrenceEndDate")} />
          </div>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" placeholder="Opcional" {...form.register("notes")} />
        </div>
      </div>

      <Button className="w-full" size="lg" type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}
