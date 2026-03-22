"use client";

import Link from "next/link";
import { ArrowRight, Cloud, ShieldCheck, Smartphone, Sparkles, Zap } from "lucide-react";

import { RuntimeModeBadge } from "@/components/auth/runtime-mode-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PublicLanding() {
  return (
    <div className="aurora-hero app-backdrop-grid mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center px-4 py-12 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="liquid-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-emerald-200">
              <Cloud className="size-4" />
              Agora com conta, sessão e sync em nuvem
            </div>
            <RuntimeModeBadge />
            <div className="liquid-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="size-4" />
              UI premium mobile-first 2026
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">
              Seu hub financeiro e do automóvel com a mesma conta no celular e no PC.
            </h1>
            <p className="max-w-2xl text-base text-zinc-400 sm:text-lg">
              Entre com sua conta para recuperar seus próprios gastos, veículos, cartões e contas em
              tempo real, sem perder o fallback local quando precisar.
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="liquid-card premium-hover rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sync</p>
              <p className="mt-2 text-sm text-zinc-200">Mudou em um dispositivo, apareceu no outro.</p>
            </div>
            <div className="liquid-card premium-hover rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fallback</p>
              <p className="mt-2 text-sm text-zinc-200">Sem env ou sem rede, continua em modo local.</p>
            </div>
            <div className="liquid-card premium-hover rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Segurança</p>
              <p className="mt-2 text-sm text-zinc-200">RLS por workspace e sessão real por cookie.</p>
            </div>
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
            {
              icon: Zap,
              title: "Ações rápidas",
              body: "Painéis flutuantes com auto-recolhimento para não poluir a tela.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="liquid-card premium-hover">
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
