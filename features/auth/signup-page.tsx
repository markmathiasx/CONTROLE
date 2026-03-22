"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, MailCheck, ShieldCheck, UserPlus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { RuntimeModeBadge } from "@/components/auth/runtime-mode-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/use-auth-store";

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Seu login precisa ter pelo menos 3 caracteres.")
    .max(24, "Seu login pode ter no máximo 24 caracteres.")
    .regex(/^[a-z0-9._-]+$/, "Use apenas letras minúsculas, números, ponto, hífen ou underline."),
  displayName: z.string().min(2, "Digite um nome para aparecer no app."),
  email: z.string().email("Digite um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha pode ter no máximo 72 caracteres.")
    .regex(/[a-z]/, "Inclua ao menos 1 letra minúscula.")
    .regex(/[A-Z]/, "Inclua ao menos 1 letra maiúscula.")
    .regex(/\d/, "Inclua ao menos 1 número.")
    .regex(/[^A-Za-z0-9]/, "Inclua ao menos 1 símbolo."),
  confirmPassword: z.string().min(1, "Confirme sua senha."),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas não conferem.",
});

type SignupValues = z.infer<typeof signupSchema>;

export function SignupPage() {
  const router = useRouter();
  const runtimeConfig = useAuthStore((state) => state.runtimeConfig);
  const refreshAuth = useAuthStore((state) => state.refresh);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [capsLockOn, setCapsLockOn] = React.useState(false);
  const [usernameTouched, setUsernameTouched] = React.useState(false);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const usernameRegister = form.register("username");
  const passwordRegister = form.register("password");
  const confirmPasswordRegister = form.register("confirmPassword");
  const currentPassword = form.watch("password");
  const currentDisplayName = form.watch("displayName");

  React.useEffect(() => {
    if (usernameTouched) {
      return;
    }

    const currentUsername = form.getValues("username");
    if (currentUsername.trim()) {
      return;
    }

    const suggested = currentDisplayName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 24);

    if (suggested) {
      form.setValue("username", suggested, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [currentDisplayName, form, usernameTouched]);

  async function onSubmit(values: SignupValues) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        needsEmailConfirmation?: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Não foi possível criar a conta.");
      }

      if (payload.needsEmailConfirmation) {
        setConfirmationEmail(values.email);
        toast.success("Conta criada. Confirme seu e-mail para continuar.");
        return;
      }

      await refreshAuth();
      toast.success("Conta criada com sucesso.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="aurora-hero app-backdrop-grid mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="liquid-shell premium-hover surface-animate">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <RuntimeModeBadge />
              <div className="liquid-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-cyan-100">
                <ShieldCheck className="size-3.5" />
                Workspace pessoal automático
              </div>
            </div>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>
              Seu login vira seu identificador principal. O e-mail fica para autenticação,
              recuperação e uso do mesmo controle em mais de um dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {confirmationEmail ? (
              <div className="space-y-4 rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <div className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                  <MailCheck className="size-5" />
                </div>
                <div className="space-y-2">
                  <p className="font-heading text-xl font-semibold text-zinc-50">
                    Falta confirmar seu e-mail
                  </p>
                  <p className="text-sm leading-6 text-zinc-300">
                    Enviamos uma mensagem para <span className="font-medium text-zinc-100">{confirmationEmail}</span>.
                    Depois de confirmar, volte para entrar e sincronizar seu workspace.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-2xl"
                  onClick={() => router.replace("/login")}
                >
                  <CheckCircle2 className="size-4" />
                  Ir para o login
                </Button>
              </div>
            ) : null}

            {!runtimeConfig.hasSupabase ? (
              <div className="space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                <p>Este ambiente está em modo local. Configure o Supabase para liberar cadastro e nuvem.</p>
                <Button asChild variant="secondary" className="w-full rounded-2xl">
                  <Link href="/">Continuar no modo local</Link>
                </Button>
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label>Login</Label>
                <Input
                  placeholder="mark.finance"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  {...usernameRegister}
                  onChange={(event) => {
                    usernameRegister.onChange(event);
                    setUsernameTouched(true);
                  }}
                />
                {form.formState.errors.username ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.username.message}</p>
                ) : null}
                {!form.formState.errors.username && form.getValues("username") ? (
                  <p className="text-xs text-zinc-500">Identificador público: @{form.getValues("username")}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Nome para aparecer</Label>
                <Input placeholder="Mark" autoComplete="name" {...form.register("displayName")} />
                {form.formState.errors.displayName ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.displayName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Pelo menos 8 caracteres"
                    className="pr-11"
                    autoComplete="new-password"
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
                {form.formState.errors.password ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    className="pr-11"
                    autoComplete="new-password"
                    {...confirmPasswordRegister}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:text-zinc-200"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.confirmPassword.message}</p>
                ) : null}
              </div>

            <div className="liquid-card rounded-2xl p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Força da senha</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    { ok: currentPassword.length >= 8, label: "8+ caracteres" },
                    { ok: /[a-z]/.test(currentPassword), label: "1 letra minúscula" },
                    { ok: /[A-Z]/.test(currentPassword), label: "1 letra maiúscula" },
                    { ok: /[0-9]/.test(currentPassword), label: "1 número" },
                    { ok: /[^A-Za-z0-9]/.test(currentPassword), label: "1 símbolo" },
                  ].map((item) => (
                    <p key={item.label} className={`text-xs ${item.ok ? "text-emerald-300" : "text-zinc-500"}`}>
                      {item.ok ? "✓" : "•"} {item.label}
                    </p>
                  ))}
                </div>
                {capsLockOn ? <p className="mt-3 text-xs text-amber-300">Caps Lock está ativado.</p> : null}
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl"
                disabled={submitting || !runtimeConfig.hasSupabase || Boolean(confirmationEmail)}
              >
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                Criar conta
              </Button>
            </form>

            <p className="text-sm text-zinc-400">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
                Entrar
              </Link>
            </p>

            <div className="liquid-card rounded-2xl p-3">
              <p className="flex items-center gap-2 text-xs text-zinc-300">
                <ShieldCheck className="size-4 text-emerald-300" />
                Senha tratada somente pelo Supabase Auth, sem armazenamento manual em tabela própria.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="liquid-shell float-soft border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,145,178,0.16),rgba(5,10,21,0.98))]">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Workspace pessoal</p>
              <div className="liquid-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-zinc-100">
                <UserPlus className="size-3.5" />
                Dados separados por conta
              </div>
            </div>
            <h1 className="font-heading text-3xl font-semibold text-zinc-50">
              Sua conta já nasce pronta para usar sozinho agora e compartilhar depois.
            </h1>
            <p className="text-sm leading-6 text-zinc-300">
              No cadastro, o sistema cria seu perfil, seu workspace pessoal e deixa a base pronta para
              você incluir sua namorada no futuro sem refazer os dados. Cada novo login começa
              com um espaço próprio, sem herdar gastos ou veículos de outra pessoa.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="liquid-card rounded-2xl p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Bootstrap automático</p>
                <p className="mt-2 text-sm text-zinc-200">Perfil, workspace e membership criados via trigger.</p>
              </div>
              <div className="liquid-card rounded-2xl p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Escalável</p>
                <p className="mt-2 text-sm text-zinc-200">
                  Estrutura pronta para muitos usuários sem misturar dados entre contas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
