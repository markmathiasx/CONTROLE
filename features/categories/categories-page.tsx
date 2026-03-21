"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { CategoryBadge } from "@/components/shared/category-badge";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { colorOptions, iconOptions } from "@/lib/constants";
import { getIcon } from "@/lib/icon-map";
import { useFinanceStore } from "@/store/use-finance-store";
import type { CategoryFormValues } from "@/types/forms";

const initialForm: CategoryFormValues = {
  name: "",
  color: "#10b981",
  icon: "wallet",
  keywords: "",
  budgetable: true,
  scope: "finance",
};

export function CategoriesPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const saveCategory = useFinanceStore((state) => state.saveCategory);
  const archiveCategory = useFinanceStore((state) => state.archiveCategory);
  const [form, setForm] = React.useState<CategoryFormValues>(initialForm);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={3} rows={2} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Categorias</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Ajuste o vocabulário do app ao seu dia a dia.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Editar categoria" : "Nova categoria"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, color }))}
                  className={`size-9 rounded-full border ${form.color === color ? "border-white" : "border-white/10"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => {
                const Icon = getIcon(icon);
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, icon }))}
                    className={`rounded-2xl border p-2 ${form.icon === icon ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-white/6"}`}
                  >
                    <Icon className="size-4 text-zinc-100" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Palavras-chave</Label>
            <Input
              value={form.keywords}
              onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))}
              placeholder="mercado, compra, atacado"
            />
          </div>
          <div className="space-y-2">
            <Label>Escopo</Label>
            <Select value={form.scope} onValueChange={(value) => setForm((current) => ({ ...current, scope: value as CategoryFormValues["scope"] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finance">Financeiro</SelectItem>
                <SelectItem value="shared">Compartilhado</SelectItem>
                <SelectItem value="moto">Automóvel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.budgetable}
              onCheckedChange={(checked) => setForm((current) => ({ ...current, budgetable: checked }))}
            />
            <p className="text-sm text-zinc-200">Pode ter orçamento</p>
          </div>
          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                saveCategory(form);
                setForm(initialForm);
              }}
            >
              {form.id ? "Atualizar categoria" : "Salvar categoria"}
            </Button>
            {form.id ? (
              <Button variant="ghost" type="button" onClick={() => setForm(initialForm)}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.categories.map((category) => (
          <Card key={category.id} className={category.archivedAt ? "opacity-55" : ""}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <CategoryBadge category={category} />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setForm({
                        id: category.id,
                        name: category.name,
                        color: category.color,
                        icon: category.icon,
                        keywords: category.keywords.join(", "),
                        budgetable: category.budgetable,
                        scope: category.scope,
                      })
                    }
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {!category.archivedAt ? (
                    <Button variant="ghost" size="icon" onClick={() => archiveCategory(category.id)}>
                      <Trash2 className="size-4 text-rose-300" />
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-zinc-400">{category.keywords.join(", ") || "Sem aliases"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
