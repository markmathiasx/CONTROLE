"use client";

import * as React from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { themeLabels } from "@/lib/constants";
import { useFinanceStore } from "@/store/use-finance-store";
import type { SettingsFormValues } from "@/types/forms";

export function SettingsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const updateSettings = useFinanceStore((state) => state.updateSettings);
  const toggleProfileActive = useFinanceStore((state) => state.toggleProfileActive);
  const importSnapshot = useFinanceStore((state) => state.importSnapshot);
  const resetWorkspace = useFinanceStore((state) => state.resetWorkspace);
  const [form, setForm] = React.useState<SettingsFormValues>({
    salaryMonthly: 2000,
    vrMonthly: 800,
    salaryDay: 5,
    vrDay: 3,
    theme: "dark",
    operationalSettings: {
      energyRatePerKwh: 1.15,
      printerPowerWatts: 80,
      extraFixedCostPerProduction: 2,
      manualLaborRatePerHour: 12,
    },
  });

  React.useEffect(() => {
    if (snapshot) {
      setForm({
        salaryMonthly: snapshot.settings.salaryMonthly,
        vrMonthly: snapshot.settings.vrMonthly,
        salaryDay: snapshot.settings.salaryDay,
        vrDay: snapshot.settings.vrDay,
        theme: snapshot.settings.theme,
        operationalSettings: snapshot.operationalSettings,
      });
    }
  }, [snapshot]);

  if (!initialized || !snapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Configurações</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Ajustes do mês, tema e segurança dos seus dados.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros financeiros e operacionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Salário mensal</Label>
            <Input type="number" value={form.salaryMonthly} onChange={(event) => setForm((current) => ({ ...current, salaryMonthly: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>VR mensal</Label>
            <Input type="number" value={form.vrMonthly} onChange={(event) => setForm((current) => ({ ...current, vrMonthly: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Dia do salário</Label>
            <Input type="number" value={form.salaryDay} onChange={(event) => setForm((current) => ({ ...current, salaryDay: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Dia do VR</Label>
            <Input type="number" value={form.vrDay} onChange={(event) => setForm((current) => ({ ...current, vrDay: Number(event.target.value) }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tema</Label>
            <Select value={form.theme} onValueChange={(value) => setForm((current) => ({ ...current, theme: value as SettingsFormValues["theme"] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tarifa de energia por kWh</Label>
            <Input type="number" step="0.01" value={form.operationalSettings.energyRatePerKwh} onChange={(event) => setForm((current) => ({ ...current, operationalSettings: { ...current.operationalSettings, energyRatePerKwh: Number(event.target.value) } }))} />
          </div>
          <div className="space-y-2">
            <Label>Potência média da impressora (W)</Label>
            <Input type="number" value={form.operationalSettings.printerPowerWatts} onChange={(event) => setForm((current) => ({ ...current, operationalSettings: { ...current.operationalSettings, printerPowerWatts: Number(event.target.value) } }))} />
          </div>
          <div className="space-y-2">
            <Label>Custo fixo extra por produção</Label>
            <Input type="number" step="0.01" value={form.operationalSettings.extraFixedCostPerProduction} onChange={(event) => setForm((current) => ({ ...current, operationalSettings: { ...current.operationalSettings, extraFixedCostPerProduction: Number(event.target.value) } }))} />
          </div>
          <div className="space-y-2">
            <Label>Custo manual por hora</Label>
            <Input type="number" step="0.01" value={form.operationalSettings.manualLaborRatePerHour} onChange={(event) => setForm((current) => ({ ...current, operationalSettings: { ...current.operationalSettings, manualLaborRatePerHour: Number(event.target.value) } }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="button" onClick={() => updateSettings(form)}>
              Salvar configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Centros ativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.costCenters.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
            >
              <div>
                <p className="font-medium text-zinc-50">{profile.name}</p>
                <p className="text-sm text-zinc-400">Aparece em filtros, dashboards e relatórios</p>
              </div>
              <Switch checked={profile.active} onCheckedChange={() => toggleProfileActive(profile.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup e seed</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `controle-backup-${new Date().toISOString().slice(0, 10)}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="size-4" />
            Exportar backup
          </Button>

          <Button variant="secondary" asChild>
            <label className="cursor-pointer">
              <Upload className="size-4" />
              Importar backup
              <input
                hidden
                type="file"
                accept="application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  const text = await file.text();
                  importSnapshot(JSON.parse(text));
                  toast.success("Backup importado com sucesso.");
                }}
              />
            </label>
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              resetWorkspace();
              toast.success("Seed local restaurada.");
            }}
          >
            <RotateCcw className="size-4" />
            Resetar para seed
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
