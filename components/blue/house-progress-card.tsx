"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Home, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  HouseSettings,
  HousePayment,
  currency,
  debtSummary,
} from "@/lib/blue/domain";
export function HouseProgressCard({
  settings,
  payments,
}: {
  settings: HouseSettings;
  payments: HousePayment[];
}) {
  const summary = debtSummary(settings, payments),
    reduced = useReducedMotion();
  const nextDue = (() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(now)
      .split("-")
      .map(Number);
    const offset =
      parts[2] > settings.due_day ||
      payments.some((p) =>
        p.date.startsWith(`${parts[0]}-${String(parts[1]).padStart(2, "0")}`),
      )
        ? 1
        : 0;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      timeZone: "UTC",
    }).format(
      new Date(Date.UTC(parts[0], parts[1] - 1 + offset, settings.due_day)),
    );
  })();
  return (
    <Card className="house-progress-card">
      <CardContent className="house-detail">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CASA PRÓPRIA</span>
            <h2>Um passo de cada vez.</h2>
            <p>
              {currency(summary.paid)} pagos de {currency(settings.total_cents)}
            </p>
          </div>
          <span className="house-detail-icon">
            <Home size={42} />
          </span>
        </div>
        <div className="progress-label">
          <span>O futuro está cada vez mais perto</span>
          <strong>{summary.progress.toFixed(1)}%</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={summary.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da casa"
        >
          <motion.span
            initial={{ width: reduced ? `${summary.progress}%` : 0 }}
            animate={{ width: `${summary.progress}%` }}
            transition={{ duration: reduced ? 0 : 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="progress-caption">
          <span>{currency(summary.paid)} conquistados</span>
          <span>{currency(summary.remaining)} restantes</span>
        </div>
        <div className="house-next">
          <div>
            <CalendarDays size={18} />
            <span>
              Próximo vencimento
              <strong>{summary.remaining ? nextDue : "Casa quitada"}</strong>
            </span>
          </div>
          <div>
            <Home size={18} />
            <span>
              Para conquistar
              <strong>
                {summary.remainingInstallments} parcelas restantes
              </strong>
            </span>
          </div>
        </div>
        <div className="debt-notes">
          <p>
            Parcela mensal:{" "}
            <strong>{currency(settings.installment_cents)}</strong> · última
            parcela estimada:{" "}
            <strong>{currency(summary.lastInstallment)}</strong>
          </p>
          <p>
            Saldo inicial: {currency(settings.opening_paid_cents)} em{" "}
            {settings.opening_installments} parcelas já pagas, sem datas
            informadas.
          </p>
          <p>
            Previsão: {summary.payoff}. Considera o saldo e o próximo
            vencimento, sem juros ou multas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
