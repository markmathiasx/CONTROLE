"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, LoaderCircle, MailCheck, UserPlus } from "lucide-react";
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
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

type SignupValues = z.infer<typeof signupSchema>;

export function SignupPage() {
  const router = useRouter();
  const runtimeConfig = useAuthStore((state) => state.runtimeConfig);
  const refreshAuth = useAuthStore((state) => state.refresh);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
    },
  });

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
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <RuntimeModeBadge />
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>
              Seu login vira seu identificador principal. O e-mail fica para autenticação e recuperação.
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
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                Este ambiente está em modo local. Configure o Supabase para liberar cadastro e nuvem.
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label>Login</Label>
                <Input placeholder="mark.finance" {...form.register("username")} />
                {form.formState.errors.username ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.username.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Nome para aparecer</Label>
                <Input placeholder="Mark" {...form.register("displayName")} />
                {form.formState.errors.displayName ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.displayName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" placeholder="voce@email.com" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" placeholder="Pelo menos 6 caracteres" {...form.register("password")} />
                {form.formState.errors.password ? (
                  <p className="text-sm text-rose-300">{form.formState.errors.password.message}</p>
                ) : null}
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
          </CardContent>
        </Card>

        <Card className="border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,145,178,0.14),rgba(9,9,11,0.96))]">
          <CardContent className="space-y-5 p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Workspace pessoal</p>
            <h1 className="font-heading text-3xl font-semibold text-zinc-50">
              Sua conta já nasce pronta para usar sozinho agora e compartilhar depois.
            </h1>
            <p className="text-sm leading-6 text-zinc-300">
              No cadastro, o sistema cria seu perfil, seu workspace pessoal e deixa a base pronta para
              você incluir sua namorada no futuro sem refazer os dados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
