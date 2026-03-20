"use client";

import Link from "next/link";
import { ArrowRight, Cloud, ShieldCheck, Smartphone } from "lucide-react";

import { RuntimeModeBadge } from "@/components/auth/runtime-mode-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PublicLanding() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center px-4 py-12 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <Cloud className="size-4" />
              Agora com conta, sessão e sync em nuvem
            </div>
            <RuntimeModeBadge />
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">
              Seu hub financeiro, do automóvel e da loja com a mesma conta no celular e no PC.
            </h1>
            <p className="max-w-2xl text-base text-zinc-400 sm:text-lg">
              Entre com sua conta para sincronizar finanças, produção, estoque e operação do automóvel
              em tempo real, sem perder o fallback local quando precisar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-2xl">
              <Link href="/cadastro">
                Criar conta
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-2xl">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            {
              icon: ShieldCheck,
              title: "Sessão real",
              body: "Auth do Supabase com login persistente, logout real e rotas protegidas.",
            },
            {
              icon: Smartphone,
              title: "Multi-dispositivo",
              body: "Continue no celular e veja no PC com sync do mesmo workspace.",
            },
            {
              icon: Cloud,
              title: "Local + nuvem",
              body: "Se faltar env ou conexão, o app continua com cache local e recuperação.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardContent className="space-y-4 p-5">
                  <div className="inline-flex rounded-2xl border border-white/10 bg-white/6 p-3 text-emerald-200">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-heading text-lg font-semibold text-zinc-50">{item.title}</p>
                    <p className="text-sm leading-6 text-zinc-400">{item.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
