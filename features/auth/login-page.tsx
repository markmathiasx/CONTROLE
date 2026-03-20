"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { RuntimeModeBadge } from "@/components/auth/runtime-mode-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/use-auth-store";

const loginSchema = z.object({
  identifier: z.string().min(1, "Digite seu login ou e-mail."),
  password: z.string().min(1, "Digite sua senha."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runtimeConfig = useAuthStore((state) => state.runtimeConfig);
  const authError = useAuthStore((state) => state.authError);
  const refreshAuth = useAuthStore((state) => state.refresh);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsLockOn, setCapsLockOn] = React.useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const identifierRegister = form.register("identifier");
  const passwordRegister = form.register("password");

  const nextPath = searchParams.get("next");
  const safeNextPath = nextPath?.startsWith("/") ? nextPath : "/";

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rememberedIdentifier = window.localStorage.getItem("mmsvh:last-login-identifier");
    if (!rememberedIdentifier) {
      return;
    }
    if (!form.getValues("identifier")) {
      form.setValue("identifier", rememberedIdentifier, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [form]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Não foi possível entrar.");
      }

      window.localStorage.setItem("mmsvh:last-login-identifier", values.identifier.trim());
      await refreshAuth();
      toast.success("Login realizado com sucesso.");
      router.replace(safeNextPath as Route);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="aurora-hero mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel premium-hover">
          <CardHeader>
            <RuntimeModeBadge />
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Use seu login ou e-mail para abrir o mesmo workspace no celular e no desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!runtimeConfig.hasSupabase ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                Este ambiente está em modo local. Configure o Supabase para usar login e sincronização.
              </div>
            ) : (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                Conta obrigatória neste ambiente: crie seu usuário em <Link href="/cadastro" className="font-semibold underline underline-offset-4">/cadastro</Link> para acessar o hub.
              </div>
            )}

            {authError ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                {authError}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label>Login ou e-mail</Label>
                <Input placeholder="seu.login ou voce@email.com" {...identifierRegister} />
                {form.formState.errors.identifier ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.identifier.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    className="pr-11"
                    {...passwordRegister}
                    onKeyUp={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
                    onBlur={(event) => {
                      passwordRegister.onBlur(event);
                      setCapsLockOn(false);
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:text-zinc-200"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {capsLockOn ? (
                  <p className="text-xs text-amber-300">Caps Lock está ativado.</p>
                ) : null}
                {form.formState.errors.password ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full rounded-2xl" disabled={submitting || !runtimeConfig.hasSupabase}>
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                Entrar
              </Button>
            </form>

            <p className="text-sm text-zinc-400">
              Ainda não tem conta?{" "}
              <Link href="/cadastro" className="font-medium text-emerald-300 hover:text-emerald-200">
                Criar conta
              </Link>
            </p>

            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <p className="flex items-center gap-2 text-xs text-zinc-300">
                <ShieldCheck className="size-4 text-emerald-300" />
                Sessão protegida por cookie seguro e políticas de acesso por workspace.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel float-soft border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(9,9,11,0.96))]">
          <CardContent className="space-y-5 p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-200/80">Cloud mode</p>
            <h1 className="font-heading text-3xl font-semibold text-zinc-50">
              Tudo sincronizado, sem abandonar o jeito rápido de usar no celular.
            </h1>
            <p className="text-sm leading-6 text-zinc-300">
              Depois do login, o app mantém o cache local para velocidade, sincroniza com a nuvem e
              ainda pode importar seus dados antigos deste aparelho.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Login único</p>
                <p className="mt-2 text-sm text-zinc-200">Acesse por login ou e-mail no mesmo campo.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resiliência</p>
                <p className="mt-2 text-sm text-zinc-200">Sem internet, o cache local protege sua sessão de trabalho.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
