"use client";

import * as React from "react";
import {
  Bike,
  CarFront,
  Download,
  Fuel,
  HardDriveDownload,
  MonitorSmartphone,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Users,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { WorkspaceContextList } from "@/components/shared/workspace-context-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  estimateVehiclePresetCostProfile,
  findVehiclePreset,
  getVehicleCatalogPresetOptions,
  getVehicleMaintenanceReferences,
  getVehiclePresetById,
  getVehiclePresetBrandOptions,
  themeLabels,
  vehicleFixedCostLabels,
  vehiclePresetYearOptions,
  vehicleTypeLabels,
} from "@/lib/constants";
import { formatCurrencyBRL } from "@/lib/formatters";
import { useAuthStore } from "@/store/use-auth-store";
import { useFinanceStore } from "@/store/use-finance-store";
import type { SettingsFormValues, VehicleFormValues } from "@/types/forms";
import { getWorkspaceKindLabel } from "@/utils/workspaces";

const memberRoleLabels = {
  owner: "Dono",
  member: "Membro",
} as const;

function toVehicleFormState(vehicle?: {
  id?: string;
  vehicleType?: "car" | "motorcycle";
  brand?: string;
  model?: string;
  year?: number;
  nickname?: string;
  plate?: string | null;
  fuelType?: string;
  currentOdometerKm?: number;
  averageCityKmPerLiter?: number | null;
  averageHighwayKmPerLiter?: number | null;
  tankCapacityLiters?: number | null;
  monthlyDistanceGoalKm?: number | null;
  fixedCosts?: {
    ipva?: {
      enabled?: boolean;
      amount?: number;
      dueMonth?: number;
      dueDay?: number;
      notes?: string | null;
    } | null;
    insurance?: {
      enabled?: boolean;
      amount?: number;
      dueMonth?: number;
      dueDay?: number;
      notes?: string | null;
    } | null;
    licensing?: {
      enabled?: boolean;
      amount?: number;
      dueMonth?: number;
      dueDay?: number;
      notes?: string | null;
    } | null;
  } | null;
  notes?: string | null;
}): VehicleFormValues {
  return {
    id: vehicle?.id,
    vehicleType: vehicle?.vehicleType ?? "motorcycle",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year ?? new Date().getFullYear(),
    nickname: vehicle?.nickname ?? "",
    plate: vehicle?.plate ?? "",
    fuelType: vehicle?.fuelType ?? "Flex",
    currentOdometerKm: vehicle?.currentOdometerKm ?? 0,
    averageCityKmPerLiter: vehicle?.averageCityKmPerLiter ?? undefined,
    averageHighwayKmPerLiter: vehicle?.averageHighwayKmPerLiter ?? undefined,
    tankCapacityLiters: vehicle?.tankCapacityLiters ?? undefined,
    monthlyDistanceGoalKm: vehicle?.monthlyDistanceGoalKm ?? undefined,
    fixedCosts: {
      ipva: {
        enabled: vehicle?.fixedCosts?.ipva?.enabled ?? false,
        amount: vehicle?.fixedCosts?.ipva?.amount ?? 0,
        dueMonth: vehicle?.fixedCosts?.ipva?.dueMonth ?? 1,
        dueDay: vehicle?.fixedCosts?.ipva?.dueDay ?? 25,
        notes: vehicle?.fixedCosts?.ipva?.notes ?? "",
      },
      insurance: {
        enabled: vehicle?.fixedCosts?.insurance?.enabled ?? false,
        amount: vehicle?.fixedCosts?.insurance?.amount ?? 0,
        dueMonth: vehicle?.fixedCosts?.insurance?.dueMonth ?? 6,
        dueDay: vehicle?.fixedCosts?.insurance?.dueDay ?? 10,
        notes: vehicle?.fixedCosts?.insurance?.notes ?? "",
      },
      licensing: {
        enabled: vehicle?.fixedCosts?.licensing?.enabled ?? false,
        amount: vehicle?.fixedCosts?.licensing?.amount ?? 0,
        dueMonth: vehicle?.fixedCosts?.licensing?.dueMonth ?? 9,
        dueDay: vehicle?.fixedCosts?.licensing?.dueDay ?? 15,
        notes: vehicle?.fixedCosts?.licensing?.notes ?? "",
      },
    },
    notes: vehicle?.notes ?? "",
  };
}

export function SettingsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const updateSettings = useFinanceStore((state) => state.updateSettings);
  const toggleProfileActive = useFinanceStore((state) => state.toggleProfileActive);
  const importSnapshot = useFinanceStore((state) => state.importSnapshot);
  const resetWorkspace = useFinanceStore((state) => state.resetWorkspace);
  const saveVehicle = useFinanceStore((state) => state.saveVehicle);
  const deleteVehicle = useFinanceStore((state) => state.deleteVehicle);

  const authStatus = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);
  const workspaces = useAuthStore((state) => state.workspaces);
  const memberships = useAuthStore((state) => state.memberships);
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const updateThemePreference = useAuthStore((state) => state.updateThemePreference);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const switchWorkspace = useAuthStore((state) => state.switchWorkspace);
  const createWorkspace = useAuthStore((state) => state.createWorkspace);
  const renameWorkspace = useAuthStore((state) => state.renameWorkspace);

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
  const [profileForm, setProfileForm] = React.useState({
    displayName: "",
    avatarUrl: "",
  });
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("");
  const [newWorkspaceKind, setNewWorkspaceKind] = React.useState<"shared" | "personal">("shared");
  const [selectedVehicleId, setSelectedVehicleId] = React.useState("");
  const [vehiclePresetId, setVehiclePresetId] = React.useState("custom");
  const [vehiclePresetTypeFilter, setVehiclePresetTypeFilter] = React.useState<"all" | VehicleFormValues["vehicleType"]>("all");
  const [vehiclePresetYearFilter, setVehiclePresetYearFilter] = React.useState<number | "all">("all");
  const [vehiclePresetBrandFilter, setVehiclePresetBrandFilter] = React.useState<string | "all">("all");
  const [vehiclePresetQuery, setVehiclePresetQuery] = React.useState("");
  const [vehicleForm, setVehicleForm] = React.useState<VehicleFormValues>(() => toVehicleFormState());
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  const activeWorkspace = React.useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );

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

  React.useEffect(() => {
    setProfileForm({
      displayName: profile?.displayName ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
    });
  }, [profile]);

  React.useEffect(() => {
    setWorkspaceName(activeWorkspace?.name ?? "");
  }, [activeWorkspace?.name]);

  const membershipByWorkspaceId = React.useMemo(
    () =>
      memberships.reduce<Record<string, "owner" | "member">>((acc, membership) => {
        acc[membership.workspaceId] = membership.role;
        return acc;
      }, {}),
    [memberships],
  );

  const selectedVehicle = React.useMemo(
    () =>
      snapshot?.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
      snapshot?.vehicles[0] ??
      null,
    [selectedVehicleId, snapshot],
  );

  React.useEffect(() => {
    if (!snapshot?.vehicles.length) {
      return;
    }

    const resolvedVehicle =
      snapshot.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? snapshot.vehicles[0];

    if (selectedVehicleId !== resolvedVehicle.id) {
      setSelectedVehicleId(resolvedVehicle.id);
    }

    setVehicleForm((current) => {
      if (current.id === resolvedVehicle.id) {
        return current;
      }

      return toVehicleFormState(resolvedVehicle);
    });
  }, [selectedVehicleId, snapshot]);

  const filteredVehiclePresets = getVehicleCatalogPresetOptions({
    vehicleType: vehiclePresetTypeFilter,
    year: vehiclePresetYearFilter,
    query: vehiclePresetQuery,
    brand: vehiclePresetBrandFilter,
  });
  const filteredVehiclePresetBrands = React.useMemo(
    () =>
      getVehiclePresetBrandOptions({
        vehicleType: vehiclePresetTypeFilter,
        year: vehiclePresetYearFilter,
        catalogOnly: true,
      }),
    [vehiclePresetTypeFilter, vehiclePresetYearFilter],
  );

  React.useEffect(() => {
    if (vehiclePresetBrandFilter === "all") {
      return;
    }
    if (!filteredVehiclePresetBrands.includes(vehiclePresetBrandFilter)) {
      setVehiclePresetBrandFilter("all");
    }
  }, [filteredVehiclePresetBrands, vehiclePresetBrandFilter]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={3} rows={4} />;
  }

  const activeCenters = snapshot.costCenters.filter((center) => center.active).length;
  const cloudWorkspaceCount = workspaces.length;
  const canShareLater = runtimeConfig.storageMode === "supabase" && cloudWorkspaceCount > 0;
  const annualFixedVehicleCost = Object.values(vehicleForm.fixedCosts).reduce(
    (sum, rule) => sum + (rule.enabled ? rule.amount : 0),
    0,
  );
  const selectedVehiclePreset =
    getVehiclePresetById(vehiclePresetId === "custom" ? undefined : vehiclePresetId) ??
    findVehiclePreset(vehicleForm.brand, vehicleForm.model, vehicleForm.year);
  const selectedVehiclePresetAnnualCost = selectedVehiclePreset
    ? Object.values(selectedVehiclePreset.fixedCosts).reduce((sum, rule) => sum + (rule.enabled ? rule.amount : 0), 0)
    : 0;
  const selectedVehiclePresetCostProfile = selectedVehiclePreset
    ? estimateVehiclePresetCostProfile(selectedVehiclePreset, {
        annualKm: vehicleForm.monthlyDistanceGoalKm ? vehicleForm.monthlyDistanceGoalKm * 12 : undefined,
      })
    : null;
  const selectedVehiclePresetYearsLabel = selectedVehiclePreset
    ? `${selectedVehiclePreset.years[0]}-${selectedVehiclePreset.years[selectedVehiclePreset.years.length - 1]}`
    : "";
  const selectedVehiclePresetMaintenance = getVehicleMaintenanceReferences({
    presetId: selectedVehiclePreset?.id,
    vehicleType: vehicleForm.vehicleType,
  });

  function startNewVehicle(presetId?: string) {
    const preset = getVehiclePresetById(presetId);
    const currentYear = new Date().getFullYear();
    const suggestedYear = preset
      ? preset.years.some((year) => year === currentYear)
        ? currentYear
        : preset.years[preset.years.length - 1] ?? currentYear
      : currentYear;

    setSelectedVehicleId("");
    setVehiclePresetId(preset?.id ?? "custom");
    if (preset) {
      setVehiclePresetTypeFilter(preset.vehicleType);
      setVehiclePresetYearFilter(suggestedYear);
    }
    setVehicleForm({
      id: undefined,
      vehicleType: preset?.vehicleType ?? "motorcycle",
      brand: preset?.brand ?? "",
      model: preset?.model ?? "",
      year: suggestedYear,
      nickname: preset ? `${preset.brand} ${preset.model}` : "",
      plate: "",
      fuelType: preset?.fuelType ?? "Flex",
      currentOdometerKm: 0,
      averageCityKmPerLiter: preset?.averageCityKmPerLiter,
      averageHighwayKmPerLiter: preset?.averageHighwayKmPerLiter,
      tankCapacityLiters: preset?.tankCapacityLiters,
      monthlyDistanceGoalKm: undefined,
      fixedCosts: {
        ipva: {
          enabled: preset?.fixedCosts?.ipva?.enabled ?? false,
          amount: preset?.fixedCosts?.ipva?.amount ?? 0,
          dueMonth: preset?.fixedCosts?.ipva?.dueMonth ?? 1,
          dueDay: preset?.fixedCosts?.ipva?.dueDay ?? 25,
          notes: "",
        },
        insurance: {
          enabled: preset?.fixedCosts?.insurance?.enabled ?? false,
          amount: preset?.fixedCosts?.insurance?.amount ?? 0,
          dueMonth: preset?.fixedCosts?.insurance?.dueMonth ?? 6,
          dueDay: preset?.fixedCosts?.insurance?.dueDay ?? 10,
          notes: "",
        },
        licensing: {
          enabled: preset?.fixedCosts?.licensing?.enabled ?? false,
          amount: preset?.fixedCosts?.licensing?.amount ?? 0,
          dueMonth: preset?.fixedCosts?.licensing?.dueMonth ?? 9,
          dueDay: preset?.fixedCosts?.licensing?.dueDay ?? 15,
          notes: "",
        },
      },
      notes: "",
    });
  }

  function saveVehicleForm() {
    if (!vehicleForm.brand.trim() || !vehicleForm.model.trim() || !vehicleForm.nickname.trim()) {
      toast.error("Preencha marca, modelo e apelido do veículo.");
      return;
    }

    if (!vehicleForm.year || vehicleForm.year < 1980) {
      toast.error("Informe um ano válido.");
      return;
    }

    const nextId = vehicleForm.id ?? `vehicle_${crypto.randomUUID()}`;
    const payload = {
      ...vehicleForm,
      id: nextId,
      brand: vehicleForm.brand.trim(),
      model: vehicleForm.model.trim(),
      nickname: vehicleForm.nickname.trim(),
      plate: vehicleForm.plate?.trim() ?? "",
      fuelType: vehicleForm.fuelType.trim(),
      fixedCosts: {
        ipva: {
          ...vehicleForm.fixedCosts.ipva,
          notes: vehicleForm.fixedCosts.ipva.notes?.trim() ?? "",
        },
        insurance: {
          ...vehicleForm.fixedCosts.insurance,
          notes: vehicleForm.fixedCosts.insurance.notes?.trim() ?? "",
        },
        licensing: {
          ...vehicleForm.fixedCosts.licensing,
          notes: vehicleForm.fixedCosts.licensing.notes?.trim() ?? "",
        },
      },
      notes: vehicleForm.notes?.trim() ?? "",
    };

    saveVehicle(payload);
    setSelectedVehicleId(nextId);
    setVehicleForm(payload);
    setVehiclePresetId("custom");
    toast.success(vehicleForm.id ? "Veículo atualizado." : "Veículo cadastrado.");
  }

  function removeSelectedVehicle() {
    if (!selectedVehicle?.id) {
      return;
    }

    try {
      deleteVehicle(selectedVehicle.id);
      toast.success("Veículo removido.");
      setVehiclePresetId("custom");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o veículo.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Configurações</p>
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">
          Conta, contexto, operação e segurança dos seus dados.
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={MonitorSmartphone}
          label="Modo do app"
          value={runtimeConfig.storageMode === "supabase" ? "Nuvem" : "Local"}
          detail={
            runtimeConfig.storageMode === "supabase"
              ? "Conta, sessão e sync entre dispositivos"
              : "Persistência só neste navegador"
          }
          badge={{
            text: runtimeConfig.storageMode === "supabase" ? "Cloud" : "Offline-ready",
            tone: runtimeConfig.storageMode === "supabase" ? "default" : "warning",
          }}
        />
        <SummaryCard
          icon={Users}
          label="Workspaces"
          value={`${cloudWorkspaceCount || 1}`}
          detail={canShareLater ? "Base pronta para contexto compartilhado" : "Uso individual preservado"}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={UserRound}
          label="Centros ativos"
          value={`${activeCenters}`}
          detail="Aparecem em filtros, painéis e relatórios"
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
        <SummaryCard
          icon={HardDriveDownload}
          label="Backup"
          value="JSON"
          detail="Exportação e restauração completa do snapshot"
          accent="from-amber-400/20 via-amber-500/10 to-transparent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modo de dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
            <p className="font-medium text-zinc-50">
              {runtimeConfig.storageMode === "supabase" ? "Nuvem ativa" : "Modo local ativo"}
            </p>
            <p className="mt-1">
              {runtimeConfig.storageMode === "supabase"
                ? `Conectado como ${profile?.email ?? `@${profile?.username ?? "usuario"}`}. Seus dados ficam vinculados ao workspace da conta e prontos para continuar no celular e no desktop.`
                : "O app continua 100% funcional neste navegador. Quando você ativar o Supabase, poderá criar workspaces adicionais e preparar um espaço compartilhado para usar depois com sua namorada."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-zinc-50">Conta atual</p>
                <Badge variant={runtimeConfig.storageMode === "supabase" ? "default" : "warning"}>
                  {runtimeConfig.storageMode === "supabase" ? "Autenticada" : "Local"}
                </Badge>
              </div>
              <p className="mt-1">
                {runtimeConfig.storageMode === "supabase"
                  ? `${profile?.displayName ?? profile?.username ?? "Usuário"} • ${profile?.email ?? "sem e-mail"}`
                  : "Sem login obrigatório neste ambiente."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-zinc-50">Workspace ativo</p>
                <Badge variant="muted">
                  {activeWorkspace ? getWorkspaceKindLabel(activeWorkspace.isPersonal) : "Local"}
                </Badge>
              </div>
              <p className="mt-1">
                {activeWorkspace?.name ?? snapshot.workspace.name}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-zinc-50">Tema e planejamento</p>
                <Badge variant="muted">{themeLabels[form.theme]}</Badge>
              </div>
              <p className="mt-1">
                Salário em {formatCurrencyBRL(form.salaryMonthly)}, VR em {formatCurrencyBRL(form.vrMonthly)} e tema {themeLabels[form.theme].toLowerCase()}.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
              <p className="font-medium text-zinc-50">1. Garanta um backup antes de mudanças grandes</p>
              <p className="mt-1">
                Ideal antes de resetar seed, trocar de aparelho ou reconfigurar contexto compartilhado.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
              <p className="font-medium text-zinc-50">2. Use workspace separado para casal quando quiser compartilhar</p>
              <p className="mt-1">
                Assim você preserva seu uso individual atual e prepara uma base limpa para vocês dois.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
              <p className="font-medium text-zinc-50">3. Revise salário, VR e metas do automóvel</p>
              <p className="mt-1">
                Esses números mudam bastante a leitura do saldo projetado, das reservas mensais e da pressão do mês.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {runtimeConfig.storageMode === "supabase" && authStatus === "authenticated" ? (
        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-[28px] border border-white/10 bg-white/6 p-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/90 to-cyan-400/80 text-sm font-semibold text-zinc-950">
                  {(profile?.displayName ?? profile?.username ?? "U")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-50">{profile?.displayName}</p>
                  <p className="truncate text-sm text-zinc-400">
                    @{profile?.username} • {profile?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-display-name">Nome de exibição</Label>
                <Input
                  id="profile-display-name"
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-avatar-url">Avatar por URL opcional</Label>
                <Input
                  id="profile-avatar-url"
                  inputMode="url"
                  placeholder="https://..."
                  value={profileForm.avatarUrl}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Login</p>
                  <p className="mt-1 text-sm text-zinc-100">@{profile?.username ?? "usuario"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Conta</p>
                  <p className="mt-1 text-sm text-zinc-100">{profile?.email ?? "sem e-mail"}</p>
                </div>
              </div>

              <Button
                type="button"
                className="w-full justify-center rounded-2xl"
                disabled={busyAction === "profile"}
                onClick={async () => {
                  try {
                    setBusyAction("profile");
                    await updateProfile(profileForm);
                    toast.success("Perfil atualizado.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Não foi possível atualizar o perfil.",
                    );
                  } finally {
                    setBusyAction(null);
                  }
                }}
              >
                <UserRound className="size-4" />
                Salvar perfil
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspaces e troca de contexto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <WorkspaceContextList
                className="space-y-3"
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                busyWorkspaceId={
                  busyAction?.startsWith("switch:") ? busyAction.replace("switch:", "") : null
                }
                getDescription={(workspace) => {
                  const role = membershipByWorkspaceId[workspace.id] ?? "owner";
                  return `${getWorkspaceKindLabel(workspace.isPersonal)} • ${memberRoleLabels[role]}`;
                }}
                onSelect={async (workspace, isActive) => {
                  if (isActive) {
                    return;
                  }

                  try {
                    setBusyAction(`switch:${workspace.id}`);
                    await switchWorkspace(workspace.id);
                    toast.success(`Contexto alterado para ${workspace.name}.`);
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Não foi possível trocar de workspace agora.",
                    );
                  } finally {
                    setBusyAction(null);
                  }
                }}
              />

              {activeWorkspace ? (
                <div className="rounded-[28px] border border-white/8 bg-white/6 p-4">
                  <p className="text-sm font-medium text-zinc-50">Renomear workspace ativo</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Ideal para diferenciar seu espaço pessoal do espaço compartilhado do casal.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="active-workspace-name">Nome do workspace</Label>
                      <Input
                        id="active-workspace-name"
                        value={workspaceName}
                        onChange={(event) => setWorkspaceName(event.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      className="mt-auto rounded-2xl"
                      disabled={busyAction === "rename-workspace"}
                      onClick={async () => {
                        try {
                          setBusyAction("rename-workspace");
                          await renameWorkspace(activeWorkspace.id, workspaceName);
                          toast.success("Workspace atualizado.");
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Não foi possível renomear o workspace.",
                          );
                        } finally {
                          setBusyAction(null);
                        }
                      }}
                    >
                      <Save className="size-4" />
                      Salvar nome
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[28px] border border-white/8 bg-white/6 p-4">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-emerald-300" />
                  <p className="font-medium text-zinc-50">Criar novo workspace</p>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Você pode manter o uso individual como está e já preparar um espaço compartilhado para casa, casal ou operação futura.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="new-workspace-name">Nome</Label>
                    <Input
                      id="new-workspace-name"
                      placeholder="Casa / casal"
                      value={newWorkspaceName}
                      onChange={(event) => setNewWorkspaceName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-workspace-kind">Tipo</Label>
                    <Select
                      value={newWorkspaceKind}
                      onValueChange={(value) =>
                        setNewWorkspaceKind(value as "shared" | "personal")
                      }
                    >
                      <SelectTrigger id="new-workspace-kind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shared">Compartilhado</SelectItem>
                        <SelectItem value="personal">Pessoal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    className="mt-auto rounded-2xl"
                    disabled={busyAction === "create-workspace"}
                    onClick={async () => {
                      try {
                        setBusyAction("create-workspace");
                        await createWorkspace({
                          name: newWorkspaceName,
                          isPersonal: newWorkspaceKind === "personal",
                        });
                        setNewWorkspaceName("");
                        setNewWorkspaceKind("shared");
                        toast.success("Workspace criado e ativado.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Não foi possível criar o workspace.",
                        );
                      } finally {
                        setBusyAction(null);
                      }
                    }}
                  >
                    <Users className="size-4" />
                    Criar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Perfil e workspaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <div className="rounded-[28px] border border-white/8 bg-white/6 px-4 py-4">
              <p className="font-medium text-zinc-50">Pronto para compartilhar depois</p>
              <p className="mt-1">
                A base de perfis, workspaces e membros já existe, mas a troca de contexto e o workspace compartilhado só aparecem quando você estiver usando o modo nuvem com Supabase configurado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros financeiros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salary-monthly">Salário mensal</Label>
            <Input
              id="salary-monthly"
              type="number"
              inputMode="decimal"
              value={form.salaryMonthly}
              onChange={(event) =>
                setForm((current) => ({ ...current, salaryMonthly: Number(event.target.value) }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vr-monthly">VR mensal</Label>
            <Input
              id="vr-monthly"
              type="number"
              inputMode="decimal"
              value={form.vrMonthly}
              onChange={(event) =>
                setForm((current) => ({ ...current, vrMonthly: Number(event.target.value) }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary-day">Dia do salário</Label>
            <Input
              id="salary-day"
              type="number"
              inputMode="numeric"
              value={form.salaryDay}
              onChange={(event) =>
                setForm((current) => ({ ...current, salaryDay: Number(event.target.value) }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vr-day">Dia do VR</Label>
            <Input
              id="vr-day"
              type="number"
              inputMode="numeric"
              value={form.vrDay}
              onChange={(event) =>
                setForm((current) => ({ ...current, vrDay: Number(event.target.value) }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="theme">Tema</Label>
            <Select
              value={form.theme}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, theme: value as SettingsFormValues["theme"] }))
              }
            >
              <SelectTrigger id="theme">
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
          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={async () => {
                try {
                  updateSettings(form);
                  if (runtimeConfig.storageMode === "supabase" && authStatus === "authenticated") {
                    await updateThemePreference(form.theme);
                  }
                  toast.success("Configurações salvas.");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Não foi possível salvar agora.",
                  );
                }
              }}
            >
              <Save className="size-4" />
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
          {snapshot.costCenters.map((profileCenter) => (
            <div
              key={profileCenter.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
            >
              <div>
                <p className="font-medium text-zinc-50">{profileCenter.name}</p>
                <p className="text-sm text-zinc-400">
                  Aparece em filtros, dashboards e relatórios
                </p>
              </div>
              <Switch
                aria-label={`Ativar ou ocultar ${profileCenter.name} nas análises`}
                checked={profileCenter.active}
                onCheckedChange={() => toggleProfileActive(profileCenter.id)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Veículos e metas de uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3">
              {snapshot.vehicles.map((vehicle) => {
                const isActive = selectedVehicle?.id === vehicle.id;
                const VehicleIcon = vehicle.vehicleType === "car" ? CarFront : Bike;

                return (
                  <button
                    type="button"
                    key={vehicle.id}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-white/8 bg-white/6 hover:border-white/16 hover:bg-white/8"
                    }`}
                    onClick={() => {
                      setSelectedVehicleId(vehicle.id);
                      setVehicleForm(toVehicleFormState(vehicle));
                      setVehiclePresetId("custom");
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <VehicleIcon className="size-4 text-emerald-300" />
                          <p className="font-medium text-zinc-50">{vehicle.nickname}</p>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </p>
                      </div>
                      <Badge variant={isActive ? "default" : "muted"}>
                        {vehicleTypeLabels[vehicle.vehicleType ?? "motorcycle"]}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Odômetro</p>
                        <p className="mt-1 font-medium text-zinc-100">{vehicle.currentOdometerKm} km</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Cidade</p>
                        <p className="mt-1 font-medium text-zinc-100">
                          {vehicle.averageCityKmPerLiter ? `${vehicle.averageCityKmPerLiter} km/L` : "Sem média"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="rounded-2xl border border-dashed border-white/12 bg-white/4 p-4">
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>Filtro de tipo</Label>
                    <Select
                      value={vehiclePresetTypeFilter}
                      onValueChange={(value) =>
                        setVehiclePresetTypeFilter(value as "all" | VehicleFormValues["vehicleType"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Carro + moto</SelectItem>
                        <SelectItem value="car">Carro</SelectItem>
                        <SelectItem value="motorcycle">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano de referência</Label>
                    <Select
                      value={vehiclePresetYearFilter === "all" ? "all" : String(vehiclePresetYearFilter)}
                      onValueChange={(value) =>
                        setVehiclePresetYearFilter(value === "all" ? "all" : Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os anos</SelectItem>
                        {vehiclePresetYearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select
                      value={vehiclePresetBrandFilter}
                      onValueChange={(value) => setVehiclePresetBrandFilter(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as marcas</SelectItem>
                        {filteredVehiclePresetBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buscar modelo</Label>
                    <Input
                      value={vehiclePresetQuery}
                      onChange={(event) => setVehiclePresetQuery(event.target.value)}
                      placeholder="Ex.: celta, gol 1.0, cg 125, prisma..."
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="vehicle-preset">Modelo sugerido</Label>
                      <Badge variant="muted">{filteredVehiclePresets.length} opção(ões)</Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      O catálogo agora mistura modelos atuais e legados, do primeiro ao último ano de cada linha.
                    </p>
                    <Select
                      value={vehiclePresetId}
                      onValueChange={(value) => {
                        setVehiclePresetId(value);
                        if (value === "custom") {
                          startNewVehicle();
                          return;
                        }
                        startNewVehicle(value);
                      }}
                    >
                      <SelectTrigger id="vehicle-preset">
                        <SelectValue placeholder="Escolha um preset útil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Manual</SelectItem>
                        {filteredVehiclePresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {`${vehicleTypeLabels[preset.vehicleType]} • ${preset.label}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" variant="secondary" className="mt-3 w-full rounded-2xl" onClick={() => startNewVehicle(vehiclePresetId === "custom" ? undefined : vehiclePresetId)}>
                  <Plus className="size-4" />
                  Novo veículo
                </Button>
                {selectedVehiclePreset ? (
                  <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-100">{selectedVehiclePreset.label}</p>
                      <Badge variant="muted">
                        {vehicleTypeLabels[selectedVehiclePreset.vehicleType]} • {selectedVehiclePresetYearsLabel}
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Consumo referência</p>
                        <p className="mt-1 text-sm font-medium text-zinc-100">
                          {selectedVehiclePreset.averageCityKmPerLiter} km/L cidade
                          {" • "}
                          {selectedVehiclePreset.averageHighwayKmPerLiter} km/L estrada
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Fixos anuais base</p>
                        <p className="mt-1 text-sm font-medium text-zinc-100">
                          {formatCurrencyBRL(selectedVehiclePresetAnnualCost)}/ano
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Custo estimado / km</p>
                        <p className="mt-1 text-sm font-medium text-zinc-100">
                          {selectedVehiclePresetCostProfile
                            ? formatCurrencyBRL(selectedVehiclePresetCostProfile.totalCostPerKm)
                            : formatCurrencyBRL(0)}
                          /km
                        </p>
                        <p className="text-xs text-zinc-400">
                          Combustível + manutenção + fixos
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Cesta de peças/ano</p>
                        <p className="mt-1 text-sm font-medium text-zinc-100">
                          {selectedVehiclePresetCostProfile
                            ? formatCurrencyBRL(selectedVehiclePresetCostProfile.annualMaintenanceCost)
                            : formatCurrencyBRL(0)}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Base para manutenção preventiva
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        Peças e serviços sugeridos
                      </p>
                      <div className="space-y-2">
                        {selectedVehiclePresetMaintenance.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-white/8 bg-white/4 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                              <p className="text-xs text-zinc-400">
                                {item.recommendedKmInterval ? `${item.recommendedKmInterval} km` : "km livre"}
                                {item.recommendedMonthsInterval
                                  ? ` • ${item.recommendedMonthsInterval}m`
                                  : ""}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-zinc-400">
                              {item.typicalParts.join(", ")} • {formatCurrencyBRL(item.estimatedCostMin)} a{" "}
                              {formatCurrencyBRL(item.estimatedCostMax)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={vehicleForm.vehicleType}
                    onValueChange={(value) =>
                      setVehicleForm((current) => ({
                        ...current,
                        vehicleType: value as VehicleFormValues["vehicleType"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Apelido</Label>
                  <Input
                    value={vehicleForm.nickname}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, nickname: event.target.value }))
                    }
                    placeholder="Ex.: Prisma da casa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    value={vehicleForm.brand}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, brand: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    value={vehicleForm.model}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, model: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={vehicleForm.year}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, year: Number(event.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input
                    value={vehicleForm.plate ?? ""}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, plate: event.target.value }))
                    }
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Combustível</Label>
                  <Input
                    value={vehicleForm.fuelType}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, fuelType: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Odômetro atual</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={vehicleForm.currentOdometerKm}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        currentOdometerKm: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consumo médio cidade (km/L)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={vehicleForm.averageCityKmPerLiter ?? ""}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        averageCityKmPerLiter: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consumo médio estrada (km/L)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={vehicleForm.averageHighwayKmPerLiter ?? ""}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        averageHighwayKmPerLiter: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanque (L)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={vehicleForm.tankCapacityLiters ?? ""}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        tankCapacityLiters: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta mensal (km)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={vehicleForm.monthlyDistanceGoalKm ?? ""}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        monthlyDistanceGoalKm: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Input
                    value={vehicleForm.notes ?? ""}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Uso principal, consumo real, particularidades..."
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {vehicleForm.vehicleType === "car" ? (
                      <CarFront className="size-4 text-cyan-300" />
                    ) : (
                      <Bike className="size-4 text-cyan-300" />
                    )}
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Tipo</p>
                  </div>
                  <p className="mt-2 font-medium text-zinc-100">
                    {vehicleTypeLabels[vehicleForm.vehicleType]}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Fuel className="size-4 text-amber-300" />
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Faixa de consumo</p>
                  </div>
                  <p className="mt-2 font-medium text-zinc-100">
                    {vehicleForm.averageCityKmPerLiter
                      ? `${vehicleForm.averageCityKmPerLiter} km/L`
                      : "Cidade não definida"}
                    {vehicleForm.averageHighwayKmPerLiter
                      ? ` • ${vehicleForm.averageHighwayKmPerLiter} km/L`
                      : ""}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Meta mensal</p>
                  <p className="mt-2 font-medium text-zinc-100">
                    {vehicleForm.monthlyDistanceGoalKm ? `${vehicleForm.monthlyDistanceGoalKm} km` : "Sem meta"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/6 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-zinc-50">Custos fixos anuais do veículo</p>
                    <p className="text-sm text-zinc-400">
                      IPVA, seguro e licenciamento entram na agenda automática dos relatórios e alertas.
                    </p>
                  </div>
                  <Badge variant="muted">{formatCurrencyBRL(annualFixedVehicleCost)}/ano</Badge>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  {(["ipva", "insurance", "licensing"] as const).map((costKind) => {
                    const rule = vehicleForm.fixedCosts[costKind];

                    return (
                      <div
                        key={costKind}
                        className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-zinc-100">
                              {vehicleFixedCostLabels[costKind]}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Agenda anual com valor editável
                            </p>
                          </div>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) =>
                              setVehicleForm((current) => ({
                                ...current,
                                fixedCosts: {
                                  ...current.fixedCosts,
                                  [costKind]: {
                                    ...current.fixedCosts[costKind],
                                    enabled: checked,
                                  },
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Valor anual</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              value={rule.amount}
                              onChange={(event) =>
                                setVehicleForm((current) => ({
                                  ...current,
                                  fixedCosts: {
                                    ...current.fixedCosts,
                                    [costKind]: {
                                      ...current.fixedCosts[costKind],
                                      amount: Number(event.target.value),
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Mês</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={12}
                              value={rule.dueMonth}
                              onChange={(event) =>
                                setVehicleForm((current) => ({
                                  ...current,
                                  fixedCosts: {
                                    ...current.fixedCosts,
                                    [costKind]: {
                                      ...current.fixedCosts[costKind],
                                      dueMonth: Number(event.target.value),
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dia</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={31}
                              value={rule.dueDay}
                              onChange={(event) =>
                                setVehicleForm((current) => ({
                                  ...current,
                                  fixedCosts: {
                                    ...current.fixedCosts,
                                    [costKind]: {
                                      ...current.fixedCosts[costKind],
                                      dueDay: Number(event.target.value),
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Observação opcional</Label>
                            <Input
                              value={rule.notes ?? ""}
                              placeholder="Ex.: parcela única, renovação, órgão..."
                              onChange={(event) =>
                                setVehicleForm((current) => ({
                                  ...current,
                                  fixedCosts: {
                                    ...current.fixedCosts,
                                    [costKind]: {
                                      ...current.fixedCosts[costKind],
                                      notes: event.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" className="rounded-2xl sm:flex-1" onClick={saveVehicleForm}>
                  <Save className="size-4" />
                  {vehicleForm.id ? "Salvar veículo" : "Cadastrar veículo"}
                </Button>
                <Button type="button" variant="secondary" className="rounded-2xl sm:flex-1" onClick={() => startNewVehicle()}>
                  <Plus className="size-4" />
                  Limpar formulário
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 sm:flex-1"
                  onClick={removeSelectedVehicle}
                  disabled={!selectedVehicle?.id}
                >
                  <Trash2 className="size-4" />
                  Excluir selecionado
                </Button>
              </div>
            </div>
          </div>
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
            <label className="cursor-pointer rounded-2xl" aria-label="Importar backup do aplicativo">
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

                  try {
                    const text = await file.text();
                    importSnapshot(JSON.parse(text));
                    toast.success("Backup importado com sucesso.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Falha ao importar backup. Verifique se o JSON está válido.",
                    );
                  } finally {
                    event.currentTarget.value = "";
                  }
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

      <Card>
        <CardHeader>
          <CardTitle>Deploy e operação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
            <p className="font-medium text-zinc-50">Pronto para Vercel sem quebrar o uso atual</p>
            <p className="mt-1">
              O uso individual continua intacto. Quando você quiser compartilhar depois, basta manter o Supabase configurado e usar um workspace compartilhado como contexto ativo.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
            <p className="font-medium text-zinc-50">Checklist rápido</p>
            <p className="mt-1">
              Backup exportado, tema salvo, workspace certo ativo e sincronização em dia antes de trocar de aparelho ou redeploy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
