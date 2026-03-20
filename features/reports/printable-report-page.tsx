"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, FileText, Printer } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL, formatDateBR } from "@/lib/formatters";
import { useFinanceStore } from "@/store/use-finance-store";
import {
  getPrintableSpendingReport,
  type PrintableReportStyle,
  type ReportPeriod,
} from "@/utils/finance";

const validPeriods = new Set<ReportPeriod>(["day", "week", "month", "year"]);
const validStyles = new Set<PrintableReportStyle>(["neutral", "economy", "operational"]);

export function PrintableReportPage() {
  const searchParams = useSearchParams();
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);

  const period = React.useMemo<ReportPeriod>(() => {
    const raw = searchParams.get("period");
    return raw && validPeriods.has(raw as ReportPeriod) ? (raw as ReportPeriod) : "month";
  }, [searchParams]);
  const anchorDate = searchParams.get("anchor") ?? new Date().toISOString().slice(0, 10);
  const vehicleId = (searchParams.get("vehicle") as string | "all" | null) ?? "all";
  const style = React.useMemo<PrintableReportStyle>(() => {
    const raw = searchParams.get("style");
    return raw && validStyles.has(raw as PrintableReportStyle)
      ? (raw as PrintableReportStyle)
      : "neutral";
  }, [searchParams]);

  const report = React.useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return getPrintableSpendingReport(snapshot, {
      anchorDate,
      period,
      vehicleId,
      style,
    });
  }, [anchorDate, period, snapshot, style, vehicleId]);

  if (!initialized || !snapshot || !report) {
    return <PageSkeleton cards={2} rows={4} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 print:bg-white print:px-0 print:py-0 print:text-zinc-950">
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl space-y-6 print:max-w-none print:space-y-4">
        <div className="print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Pré-visualização</p>
            <h1 className="font-heading text-3xl font-semibold text-zinc-50">
              Relatório imprimível
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" asChild>
              <Link href="/relatorios">Voltar aos relatórios</Link>
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" />
              Imprimir / salvar PDF
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-white/10 bg-white/6 print:border-zinc-200 print:bg-white print:shadow-none">
          <CardContent className="space-y-6 p-6 print:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 print:border-zinc-200 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Badge variant={report.net >= 0 ? "default" : "danger"} className="print:hidden">
                  {report.net >= 0 ? "Fechamento positivo" : "Fechamento negativo"}
                </Badge>
                <Badge variant="muted" className="ml-2 print:hidden">
                  {report.style === "economy"
                    ? "Modelo economia"
                    : report.style === "operational"
                      ? "Modelo operacional"
                      : "Modelo equilibrado"}
                </Badge>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Controle Financeiro MMSVH</p>
                <h2 className="font-heading text-3xl font-semibold text-zinc-50 print:text-zinc-950">
                  Fechamento de gastos
                </h2>
                <p className="text-sm text-zinc-400 print:text-zinc-600">
                  Workspace {snapshot.workspace.name} • referência {report.periodLabel}
                </p>
                <p className="text-sm text-zinc-300 print:text-zinc-700">{report.headline}</p>
              </div>

              <div className="grid gap-3 sm:min-w-[260px]">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 print:border-zinc-200 print:bg-zinc-50">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Gerado em</p>
                  <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">
                    {formatDateBR(new Date().toISOString().slice(0, 10))}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 print:border-zinc-200 print:bg-zinc-50">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Período</p>
                  <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">
                    {formatDateBR(report.startDate)} a {formatDateBR(report.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 print:border-zinc-200 print:bg-zinc-50">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Receitas</p>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50 print:text-zinc-950">
                  {formatCurrencyBRL(report.totalIncome)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 print:border-zinc-200 print:bg-zinc-50">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Despesas</p>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50 print:text-zinc-950">
                  {formatCurrencyBRL(report.totalExpense)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 print:border-zinc-200 print:bg-zinc-50">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Saldo líquido</p>
                <p className="mt-3 font-heading text-3xl font-semibold text-zinc-50 print:text-zinc-950">
                  {formatCurrencyBRL(report.net)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 print:border-zinc-200 print:bg-zinc-50">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Maior gasto</p>
                <p className="mt-3 text-sm font-medium text-zinc-50 print:text-zinc-950">
                  {report.biggestExpense?.description ?? "Sem destaque"}
                </p>
                <p className="mt-1 text-xs text-zinc-400 print:text-zinc-600">
                  {report.biggestExpense
                    ? `${formatDateBR(report.biggestExpense.date)} • ${formatCurrencyBRL(report.biggestExpense.amount)}`
                    : "Nenhuma despesa no período"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 print:border-zinc-200 print:bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-emerald-300 print:text-zinc-700" />
                    <p className="font-medium text-zinc-100 print:text-zinc-950">Maiores gastos</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {report.topCategories.length ? report.topCategories.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                        <div>
                          <p className="text-sm text-zinc-100 print:text-zinc-950">{item.label}</p>
                          <p className="text-xs text-zinc-400 print:text-zinc-600">
                            {Math.round(item.share)}% das despesas
                          </p>
                        </div>
                        <p className="font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(item.total)}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-zinc-400 print:text-zinc-600">Sem despesas registradas no período.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 print:border-zinc-200 print:bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-amber-300 print:text-zinc-700" />
                    <p className="font-medium text-zinc-100 print:text-zinc-950">Automóvel no período</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Escopo</p>
                      <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">{report.automovel.scopeLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Total</p>
                      <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(report.automovel.totalCost)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Combustível</p>
                      <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(report.automovel.fuelCost)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Manutenção</p>
                      <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(report.automovel.maintenanceCost)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Reserva mensal</p>
                      <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">
                        {formatCurrencyBRL(report.automovel.monthlyReserveTarget)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Custos fixos</p>
                      <p className="mt-2 font-medium text-zinc-50 print:text-zinc-950">
                        {formatCurrencyBRL(report.automovel.fixedCostTotal)}
                      </p>
                    </div>
                  </div>

                  {report.automovel.upcomingItems.length ? (
                    <div className="mt-4 space-y-3">
                      {report.automovel.upcomingItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                          <div>
                            <p className="text-sm text-zinc-100 print:text-zinc-950">{item.title}</p>
                            <p className="text-xs text-zinc-400 print:text-zinc-600">
                              {item.dueDate ? formatDateBR(item.dueDate) : "Sem data"}
                            </p>
                          </div>
                          <p className="font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(item.amount)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {report.automovel.coverageWarnings.length ? (
                    <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/8 px-4 py-3 print:border-zinc-200 print:bg-zinc-50">
                      <p className="text-sm font-medium text-amber-50 print:text-zinc-950">
                        Cobertura fixa incompleta
                      </p>
                      <div className="mt-2 space-y-2">
                        {report.automovel.coverageWarnings.map((warning) => (
                          <p key={warning} className="text-sm text-amber-50/90 print:text-zinc-700">
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 print:border-zinc-200 print:bg-zinc-50">
                  <p className="font-medium text-zinc-100 print:text-zinc-950">Centros com maior impacto</p>
                  <div className="mt-4 space-y-3">
                    {report.topCenters.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                        <p className="text-sm text-zinc-100 print:text-zinc-950">{item.label}</p>
                        <p className="font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 print:border-zinc-200 print:bg-zinc-50">
                  <p className="font-medium text-zinc-100 print:text-zinc-950">Forma de pagamento</p>
                  <div className="mt-4 space-y-3">
                    {report.paymentMethods.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 print:border-zinc-200 print:bg-white">
                        <p className="text-sm text-zinc-100 print:text-zinc-950">{item.label}</p>
                        <p className="font-medium text-zinc-50 print:text-zinc-950">{formatCurrencyBRL(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 print:border-zinc-200 print:bg-zinc-50">
                  <p className="font-medium text-zinc-100 print:text-zinc-950">Recomendações</p>
                  <div className="mt-4 space-y-3">
                    {report.recommendations.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-zinc-300 print:border-zinc-200 print:bg-white print:text-zinc-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!report.topCategories.length && !report.topCenters.length ? (
          <EmptyState
            icon={FileText}
            title="Sem dados no período"
            description="Mude a data base ou o tipo de período para gerar um fechamento imprimível."
          />
        ) : null}
      </div>
    </div>
  );
}
