"use client";

import * as React from "react";
import { CloudUpload, LoaderCircle, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { themeLabels } from "@/lib/constants";
import { useAuthStore } from "@/store/use-auth-store";
import { useFinanceStore } from "@/store/use-finance-store";
import type { ThemeMode } from "@/types/domain";

export function AuthOnboardingDialog() {
  const onboardingOpen = useAuthStore((state) => state.onboardingOpen);
  const profile = useAuthStore((state) => state.profile);
  const workspaces = useAuthStore((state) => state.workspaces);
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const userSettingsTheme = useAuthStore((state) => state.userSettings?.theme ?? null);
  const localImportSnapshot = useAuthStore((state) => state.localImportSnapshot);
  const completeInitialSetup = useAuthStore((state) => state.completeInitialSetup);
  const snapshot = useFinanceStore((state) => state.snapshot);
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [theme, setTheme] = React.useState<ThemeMode>("dark");
  const [submitting, setSubmitting] = React.useState<"merged" | "skipped" | null>(null);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null;

  React.useEffect(() => {
    if (!onboardingOpen) {
      return;
    }

    setWorkspaceName(
      activeWorkspace?.name ||
        profile?.displayName ||
        profile?.username ||
        snapshot?.workspace.name ||
        "Meu workspace",
    );
    setTheme(userSettingsTheme ?? snapshot?.settings.theme ?? "dark");
  }, [
    activeWorkspace?.name,
    onboardingOpen,
    profile?.displayName,
    profile?.username,
    snapshot?.settings.theme,
    snapshot?.workspace.name,
    userSettingsTheme,
  ]);

  async function handleSubmit(importDecision: "merged" | "skipped") {
    setSubmitting(importDecision);
    try {
      await completeInitialSetup({
        workspaceName: workspaceName.trim() || activeWorkspace?.name || "Meu workspace",
        theme,
        importDecision,
      });
      toast.success(
        importDecision === "merged"
          ? "Dados locais enviados para sua conta."
          : "Workspace na nuvem pronto para usar.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível finalizar sua conta agora.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog open={onboardingOpen} onOpenChange={() => undefined}>
      <DialogContent className="[&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Seu workspace está quase pronto</DialogTitle>
          <DialogDescription>
            Ajuste o nome, confirme o tema e escolha o que fazer com os dados locais deste aparelho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-emerald-400/15 bg-emerald-400/8 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/12 p-2">
                <Sparkles className="size-4 text-emerald-200" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-zinc-50">
                  Bem-vindo{profile?.displayName ? `, ${profile.displayName}` : ""}.
                </p>
                <p className="text-sm leading-6 text-zinc-300">
                  O app mantém cache local para velocidade e sincroniza sua base para continuar no
                  celular e no desktop com a mesma conta, sem misturar seus dados com os de outro
                  login.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Nome do workspace</Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Meu controle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-theme">Tema</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
                <SelectTrigger id="workspace-theme">
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
          </div>

          {localImportSnapshot ? (
            <div className="rounded-[28px] border border-cyan-400/15 bg-cyan-400/8 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/12 p-2">
                  <CloudUpload className="size-4 text-cyan-200" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-zinc-50">Dados locais encontrados neste aparelho</p>
                  <p className="text-sm leading-6 text-zinc-300">
                    Você pode mesclar transações, automóvel e configurações relevantes com sua
                    conta agora. O sistema tenta evitar duplicações grosseiras.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-zinc-300">
              Nenhum backup local pendente foi encontrado. Sua conta vai começar com um workspace
              limpo, sincronizado e pronto para receber só os seus próprios dados.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {localImportSnapshot ? (
              <>
                <Button
                  className="h-auto min-h-14 justify-start rounded-2xl px-4 py-3 text-left"
                  disabled={Boolean(submitting)}
                  onClick={() => void handleSubmit("merged")}
                >
                  {submitting === "merged" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <CloudUpload className="size-4" />
                  )}
                  Mesclar meus dados locais
                </Button>

                <Button
                  variant="secondary"
                  className="h-auto min-h-14 justify-start rounded-2xl px-4 py-3 text-left"
                  disabled={Boolean(submitting)}
                  onClick={() => void handleSubmit("skipped")}
                >
                  {submitting === "skipped" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                  Começar só com a nuvem
                </Button>
              </>
            ) : (
              <Button
                className="h-auto min-h-14 rounded-2xl px-4 py-3 md:col-span-2"
                disabled={Boolean(submitting)}
                onClick={() => void handleSubmit("skipped")}
              >
                {submitting === "skipped" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Concluir e entrar no app
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
