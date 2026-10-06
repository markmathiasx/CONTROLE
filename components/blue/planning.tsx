"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Plus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  BlueData,
  canEdit,
  categories,
  currency,
  parseMoney,
  todayBR,
} from "@/lib/blue/domain";
import { goalMonthlyNeed, planningSummary } from "@/lib/blue/planning";
type Props = {
  data: BlueData;
  month: string;
  busy: boolean;
  mutate: (
    action: string,
    payload: Record<string, unknown>,
    success?: string,
  ) => Promise<unknown>;
};
export function SpendingCoach({
  data,
  month,
}: {
  data: BlueData;
  month: string;
}) {
  const s = planningSummary(data, month);
  const overspent = s.budgets.filter((b) => b.percent >= 100);
  const warning =
    s.available < 0 || s.overdue.length > 0 || overspent.length > 0;
  return (
    <motion.section
      className={"spending-coach " + (warning ? "coach-warning" : "")}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="coach-intro">
        <span className="eyebrow">ANTES DA PRÓXIMA COMPRA</span>
        <h2>
          {warning
            ? "Vamos proteger o resto do mês."
            : "Um limite claro para decidir melhor."}
        </h2>
        <p>
          Receitas registradas menos gastos, contas pendentes e a parcela da
          casa. Valores previstos ainda não são dinheiro disponível.
        </p>
        <Link href="/planejamento" className="secondary">
          Abrir meu planejamento →
        </Link>
      </div>
      <div className="coach-numbers">
        <span>Disponível após compromissos</span>
        <strong className={s.available < 0 ? "negative" : ""}>
          {currency(s.available)}
        </strong>
        <div className="coach-daily">
          <Wallet size={18} />
          <div>
            <b>
              {s.dailyLimit === null
                ? "Escolha o mês atual"
                : currency(s.dailyLimit) + " por dia"}
            </b>
            <small>
              {s.daysLeft
                ? `Referência para os ${s.daysLeft} dias restantes`
                : "Limite diário calculado somente no mês atual"}
            </small>
          </div>
        </div>
      </div>
      <div className="coach-actions">
        {s.available < 0 && (
          <p>
            <AlertTriangle size={17} />
            Faltam {currency(-s.available)} para cobrir o que já está
            comprometido. Adie compras não essenciais e revise as contas.
          </p>
        )}
        {s.overdue.length > 0 && (
          <p>
            <CalendarClock size={17} />
            {s.overdue.length} conta(s) com vencimento passado. Confira antes de
            gastar.
          </p>
        )}
        {s.budgets
          .filter((b) => b.percent >= 80)
          .map((b) => (
            <p key={b.category}>
              <AlertTriangle size={17} />
              {b.category}: {Math.round(b.percent)}% do limite comprometido.
            </p>
          ))}
        {!s.budgets.length && (
          <p>
            <Target size={17} />
            Defina limites para Alimentação, Compras e Lazer. Acompanhar só o
            saldo não mostra onde reduzir.
          </p>
        )}
        {s.income === 0 && (
          <p>Registre sua renda recebida para calcular quanto pode gastar.</p>
        )}
        {s.houseReserve > 0 && (
          <p>Já reservamos {currency(s.houseReserve)} para a casa neste mês.</p>
        )}
        {s.unbudgeted.length > 0 && (
          <p>Sem limite definido: {s.unbudgeted.join(", ")}.</p>
        )}
      </div>
    </motion.section>
  );
}
export function PlanningPanel({ data, month, busy, mutate }: Props) {
  const [error, setError] = useState("");
  const [budget, setBudget] = useState({ category: "Alimentação", amount: "" });
  const [bill, setBill] = useState({
    title: "",
    amount: "",
    category: "Moradia",
    date: todayBR(),
    kind: "expense",
    repeat: false,
    installments: "1",
  });
  const [goal, setGoal] = useState({ title: "", amount: "", date: todayBR() });
  const [deposits, setDeposits] = useState<Record<string, string>>({});
  const [showPaid, setShowPaid] = useState(false);
  const depositIds = useRef<Record<string, string>>({});
  const s = planningSummary(data, month);
  const p = data.planning ?? { budgets: [], bills: [], goals: [] };
  const admin = data.user.username === "mark";
  async function submit(task: () => Promise<unknown>) {
    setError("");
    try {
      return await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confira os campos.");
      return null;
    }
  }
  return (
    <>
      <SpendingCoach data={data} month={month} />
      {error && (
        <div role="alert" className="error-box">
          {error}
        </div>
      )}
      <div className="planning-metrics">
        <div>
          <span>Contas a pagar até o fim do mês</span>
          <strong>{currency(s.pendingExpenses)}</strong>
        </div>
        <div>
          <span>Receitas ainda não recebidas</span>
          <strong>{currency(s.pendingIncome)}</strong>
        </div>
        <div>
          <span>Saldo projetado, se tudo for recebido</span>
          <strong>{currency(s.projected)}</strong>
        </div>
        <div>
          <span>Despesas no mês anterior</span>
          <strong>{currency(s.previousExpense)}</strong>
        </div>
      </div>
      <section className="panel planning-panel">
        <div className="panel-heading">
          <div>
            <h2>Limites de gastos por categoria</h2>
            <p>
              O limite mensal inclui gastos registrados e contas pendentes. Mark
              define os limites compartilhados.
            </p>
          </div>
          <Target size={24} />
        </div>
        <div className="budget-grid">
          {s.budgets.map((b) => (
            <div className="budget-card" key={b.category}>
              <div className="planning-row">
                <h3>{b.category}</h3>
                {admin && (
                  <button
                    aria-label={"Remover limite de " + b.category}
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Remover esse limite?"))
                        void mutate("budget_delete", { category: b.category });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <strong>
                {currency(b.spent + b.committed)}{" "}
                <small>de {currency(b.limit_cents)}</small>
              </strong>
              <div
                className={
                  "progress-track budget-track " +
                  (b.percent >= 100
                    ? "danger"
                    : b.percent >= 80
                      ? "attention"
                      : "")
                }
                role="progressbar"
                aria-label={"Limite de " + b.category}
                aria-valuenow={Math.min(100, Math.round(b.percent))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: Math.min(100, b.percent) + "%" }}
                />
              </div>
              <p>
                {b.remaining >= 0
                  ? currency(b.remaining) + " ainda disponíveis"
                  : currency(-b.remaining) + " acima do limite"}
              </p>
              <small>
                {currency(b.spent)} registrados · {currency(b.committed)}{" "}
                pendentes
              </small>
            </div>
          ))}
        </div>
        {!p.budgets.length && (
          <p className="planning-empty">
            Comece com os três gastos mais difíceis de controlar. Nenhum valor
            foi inventado para você.
          </p>
        )}
        {admin && (
          <form
            className="planning-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await submit(() =>
                mutate(
                  "budget_save",
                  {
                    category: budget.category,
                    limit_cents: parseMoney(budget.amount),
                  },
                  "Limite mensal salvo.",
                ),
              );
              if (r) setBudget({ ...budget, amount: "" });
            }}
          >
            <label>
              Categoria
              <select
                value={budget.category}
                onChange={(e) =>
                  setBudget({ ...budget, category: e.target.value })
                }
              >
                {categories
                  .filter((c) => c !== "Salário")
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </label>
            <label>
              Limite mensal (R$)
              <input
                value={budget.amount}
                onChange={(e) =>
                  setBudget({ ...budget, amount: e.target.value })
                }
                placeholder="Ex.: 600,00"
                inputMode="decimal"
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              <Plus size={16} />
              Salvar limite
            </button>
          </form>
        )}
      </section>
      <section className="panel planning-panel">
        <div className="panel-heading">
          <div>
            <h2>Contas, assinaturas e parcelamentos</h2>
            <p>
              Ao dar baixa, a conta vira uma movimentação uma única vez.
              Recorrências geram o próximo vencimento.
            </p>
          </div>
          <CalendarClock size={24} />
        </div>
        <form
          className="planning-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await submit(() =>
              mutate(
                "bill_save",
                {
                  id: crypto.randomUUID(),
                  title: bill.title,
                  amount_cents: parseMoney(bill.amount),
                  category: bill.category,
                  due_date: bill.date,
                  kind: bill.kind,
                  repeat_monthly: bill.repeat,
                  installments: Number(bill.installments),
                },
                "Conta agendada.",
              ),
            );
            if (r) setBill({ ...bill, title: "", amount: "" });
          }}
        >
          <label className="wide">
            Descrição
            <input
              value={bill.title}
              onChange={(e) => setBill({ ...bill, title: e.target.value })}
              required
              maxLength={160}
              placeholder="Internet, aluguel, compra no cartão…"
            />
          </label>
          <label>
            Valor total (R$)
            <input
              value={bill.amount}
              onChange={(e) => setBill({ ...bill, amount: e.target.value })}
              required
              inputMode="decimal"
            />
          </label>
          <label>
            Primeiro vencimento
            <input
              type="date"
              value={bill.date}
              onChange={(e) => setBill({ ...bill, date: e.target.value })}
              required
            />
          </label>
          <label>
            Tipo
            <select
              value={bill.kind}
              onChange={(e) => setBill({ ...bill, kind: e.target.value })}
            >
              <option value="expense">Conta a pagar</option>
              <option value="income">Valor a receber</option>
            </select>
          </label>
          <label>
            Categoria
            <select
              value={bill.category}
              onChange={(e) => setBill({ ...bill, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Parcelas
            <input
              type="number"
              min={1}
              max={60}
              value={bill.installments}
              disabled={bill.repeat}
              onChange={(e) =>
                setBill({ ...bill, installments: e.target.value })
              }
              required
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={bill.repeat}
              onChange={(e) =>
                setBill({
                  ...bill,
                  repeat: e.target.checked,
                  installments: "1",
                })
              }
            />
            Repetir todo mês
          </label>
          <button className="primary" disabled={busy}>
            <Plus size={16} />
            Agendar
          </button>
        </form>
        <p className="subtle">
          Parcelamento divide o valor total entre as parcelas. Repetição mensal
          usa o mesmo valor a cada vencimento. Pague a casa pelo módulo Nossa
          casa para atualizar a dívida.
        </p>
        <div className="planning-row">
          <h3>Agenda do período</h3>
          <button className="secondary" onClick={() => setShowPaid(!showPaid)}>
            {showPaid ? "Ocultar pagas" : "Mostrar pagas"}
          </button>
        </div>
        <div className="bill-list">
          {p.bills
            .filter(
              (b) =>
                (!b.paid_entry_id || showPaid) &&
                (b.due_date.startsWith(month) ||
                  (!b.paid_entry_id && b.due_date < month + "-01")),
            )
            .map((b) => (
              <div className="bill-row" key={b.id}>
                <span
                  className={
                    "bill-status " +
                    (b.paid_entry_id
                      ? "paid"
                      : b.due_date < todayBR()
                        ? "late"
                        : "")
                  }
                >
                  <CalendarClock size={18} />
                </span>
                <div>
                  <strong>{b.title}</strong>
                  <small>
                    {new Date(b.due_date + "T12:00:00Z").toLocaleDateString(
                      "pt-BR",
                      { timeZone: "UTC" },
                    )}{" "}
                    · {b.kind === "income" ? "A receber" : b.category}
                    {b.repeat_monthly
                      ? " · Mensal"
                      : b.installment_count > 1
                        ? ` · ${b.installment_index}/${b.installment_count}`
                        : ""}{" "}
                    · {data.users.find((u) => u.id === b.user_id)?.name}
                  </small>
                  <small>
                    {b.paid_entry_id
                      ? "Baixa registrada"
                      : b.due_date < todayBR()
                        ? "Vencimento passado — confira"
                        : "Pendente"}
                  </small>
                </div>
                <strong>{currency(b.amount_cents)}</strong>
                {canEdit(data.user, b.user_id) && !b.paid_entry_id && (
                  <div className="bill-actions">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void mutate(
                          "bill_pay",
                          { id: b.id, date: todayBR() },
                          "Baixa registrada sem duplicar o lançamento.",
                        )
                      }
                    >
                      <Check size={16} />
                      {b.kind === "income" ? "Recebi" : "Paguei"}
                    </button>
                    <button
                      aria-label={"Excluir conta " + b.title}
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Excluir esta conta pendente?"))
                          void mutate("bill_delete", { id: b.id });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
        {!p.bills.some(
          (b) =>
            b.due_date.startsWith(month) ||
            (!b.paid_entry_id && b.due_date < month + "-01"),
        ) && (
          <p className="planning-empty">
            Nenhuma conta agendada para este período.
          </p>
        )}
      </section>
      <section className="panel planning-panel">
        <div className="panel-heading">
          <div>
            <h2>Metas e reserva de emergência</h2>
            <p>Um destino para o dinheiro que você decide guardar.</p>
          </div>
          <Target size={24} />
        </div>
        <form
          className="planning-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await submit(() =>
              mutate(
                "goal_save",
                {
                  id: crypto.randomUUID(),
                  title: goal.title,
                  target_cents: parseMoney(goal.amount),
                  target_date: goal.date,
                },
                "Meta criada.",
              ),
            );
            if (r) setGoal({ ...goal, title: "", amount: "" });
          }}
        >
          <label className="wide">
            Minha meta
            <input
              required
              maxLength={160}
              value={goal.title}
              onChange={(e) => setGoal({ ...goal, title: e.target.value })}
              placeholder="Reserva de emergência, viagem, reforma…"
            />
          </label>
          <label>
            Objetivo (R$)
            <input
              required
              inputMode="decimal"
              value={goal.amount}
              onChange={(e) => setGoal({ ...goal, amount: e.target.value })}
            />
          </label>
          <label>
            Prazo
            <input
              required
              type="date"
              min={todayBR()}
              value={goal.date}
              onChange={(e) => setGoal({ ...goal, date: e.target.value })}
            />
          </label>
          <button disabled={busy} className="primary">
            <Plus size={16} />
            Criar meta
          </button>
        </form>
        <div className="budget-grid">
          {p.goals.map((g) => (
            <div className="budget-card" key={g.id}>
              <div className="planning-row">
                <h3>{g.title}</h3>
                {canEdit(data.user, g.user_id) && (
                  <button
                    disabled={busy}
                    aria-label={"Excluir meta " + g.title}
                    onClick={() => {
                      if (confirm("Excluir essa meta e seu acompanhamento?"))
                        void mutate("goal_delete", { id: g.id });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <strong>
                {currency(g.saved_cents)}{" "}
                <small>de {currency(g.target_cents)}</small>
              </strong>
              <div className="progress-track">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{
                    width: (g.saved_cents / g.target_cents) * 100 + "%",
                  }}
                />
              </div>
              <p>
                {g.saved_cents === g.target_cents
                  ? "Meta conquistada!"
                  : `Guarde ${currency(goalMonthlyNeed(g))}/mês para chegar ao objetivo.`}
              </p>
              <small>
                Prazo:{" "}
                {new Date(g.target_date + "T12:00:00Z").toLocaleDateString(
                  "pt-BR",
                  { timeZone: "UTC" },
                )}
              </small>
              {canEdit(data.user, g.user_id) &&
                g.saved_cents < g.target_cents && (
                  <form
                    className="goal-deposit"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const r = await submit(() =>
                        mutate(
                          "goal_deposit",
                          {
                            id: g.id,
                            deposit_id:
                              depositIds.current[g.id] ??
                              (depositIds.current[g.id] = crypto.randomUUID()),
                            amount_cents: parseMoney(deposits[g.id] ?? ""),
                          },
                          "Valor guardado atualizado.",
                        ),
                      );
                      if (r) {
                        delete depositIds.current[g.id];
                        setDeposits({ ...deposits, [g.id]: "" });
                      }
                    }}
                  >
                    <label>
                      Valor que já guardei (R$)
                      <input
                        required
                        inputMode="decimal"
                        value={deposits[g.id] ?? ""}
                        onChange={(e) =>
                          setDeposits({ ...deposits, [g.id]: e.target.value })
                        }
                      />
                    </label>
                    <button disabled={busy} className="secondary">
                      Registrar aporte
                    </button>
                  </form>
                )}
            </div>
          ))}
        </div>
        {!p.goals.length && (
          <p className="planning-empty">
            Crie sua primeira meta. Começar com um valor pequeno também conta.
          </p>
        )}
        <p className="subtle">
          Metas acompanham valores que você informa já ter guardado; não fazem
          transferências bancárias e não criam outra despesa automaticamente.
        </p>
      </section>
    </>
  );
}
