"use client";

import * as React from "react";
import {
  Download,
  HardDriveDownload,
  MonitorSmartphone,
  RotateCcw,
  Save,
  Upload,
  Users,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { themeLabels } from "@/lib/constants";
import { useAuthStore } from "@/store/use-auth-store";
import { useFinanceStore } from "@/store/use-finance-store";
import type { SettingsFormValues } from "@/types/forms";
import { getWorkspaceKindLabel } from "@/utils/workspaces";

const memberRoleLabels = {
  owner: "Dono",
  member: "Membro",
} as const;

export function SettingsPage() {
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const runtimeConfig = useFinanceStore((state) => state.runtimeConfig);
  const updateSettings = useFinanceStore((state) => state.updateSettings);
  const toggleProfileActive = useFinanceStore((state) => state.toggleProfileActive);
  const importSnapshot = useFinanceStore((state) => state.importSnapshot);
  const resetWorkspace = useFinanceStore((state) => state.resetWorkspace);

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

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={3} rows={4} />;
  }

  const activeCenters = snapshot.costCenters.filter((center) => center.active).length;
  const cloudWorkspaceCount = workspaces.length;
  const canShareLater = runtimeConfig.storageMode === "supabase" && cloudWorkspaceCount > 0;

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
                <p className="font-medium text-zinc-50">Tema e operação</p>
                <Badge variant="muted">{themeLabels[form.theme]}</Badge>
              </div>
              <p className="mt-1">
                Energia a {form.operationalSettings.energyRatePerKwh}/kWh e {form.operationalSettings.printerPowerWatts}W na impressora.
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
              <p className="font-medium text-zinc-50">3. Revise energia, custo manual e VR mensal</p>
              <p className="mt-1">
                Esses números mudam bastante a leitura de lucro da loja e o saldo projetado do mês.
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
              <div className="space-y-3">
                {workspaces.map((workspace) => {
                  const role = membershipByWorkspaceId[workspace.id] ?? "owner";
                  const isActive = workspace.id === activeWorkspaceId;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      aria-pressed={isActive}
                      className={`w-full rounded-[26px] border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-emerald-400/30 bg-emerald-400/10"
                          : "border-white/8 bg-white/6 hover:bg-white/10"
                      }`}
                      onClick={async () => {
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
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-50">{workspace.name}</p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {getWorkspaceKindLabel(workspace.isPersonal)} • {memberRoleLabels[role]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={workspace.isPersonal ? "muted" : "default"}>
                            {workspace.isPersonal ? "Pessoal" : "Compartilhado"}
                          </Badge>
                          {isActive ? (
                            <Badge variant="default">Ativo</Badge>
                          ) : (
                            <Badge variant="muted">
                              {busyAction === `switch:${workspace.id}` ? "Abrindo..." : "Abrir"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

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
          <CardTitle>Parâmetros financeiros e operacionais</CardTitle>
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
          <div className="space-y-2">
            <Label htmlFor="energy-rate">Tarifa de energia por kWh</Label>
            <Input
              id="energy-rate"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.operationalSettings.energyRatePerKwh}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  operationalSettings: {
                    ...current.operationalSettings,
                    energyRatePerKwh: Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer-power">Potência média da impressora (W)</Label>
            <Input
              id="printer-power"
              type="number"
              inputMode="numeric"
              value={form.operationalSettings.printerPowerWatts}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  operationalSettings: {
                    ...current.operationalSettings,
                    printerPowerWatts: Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-fixed">Custo fixo extra por produção</Label>
            <Input
              id="extra-fixed"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.operationalSettings.extraFixedCostPerProduction}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  operationalSettings: {
                    ...current.operationalSettings,
                    extraFixedCostPerProduction: Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-hourly">Custo manual por hora</Label>
            <Input
              id="manual-hourly"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.operationalSettings.manualLaborRatePerHour}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  operationalSettings: {
                    ...current.operationalSettings,
                    manualLaborRatePerHour: Number(event.target.value),
                  },
                }))
              }
            />
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
