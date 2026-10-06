import { BlueData, categories, debtSummary, todayBR } from "./domain";
export type Budget = { category: string; limit_cents: number };
export type Bill = {
  id: string;
  title: string;
  amount_cents: number;
  category: string;
  due_date: string;
  kind: "expense" | "income";
  repeat_monthly: boolean;
  installment_index: number;
  installment_count: number;
  user_id: string;
  paid_entry_id: string | null;
  paid_at: string | null;
};
export type Goal = {
  id: string;
  title: string;
  target_cents: number;
  saved_cents: number;
  target_date: string;
  user_id: string;
};
export type PlanningData = { budgets: Budget[]; bills: Bill[]; goals: Goal[] };
export function monthEnd(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export function planningSummary(
  data: BlueData,
  month: string,
  today = todayBR(),
) {
  const entries = data.entries.filter((e) => e.date.startsWith(month));
  const income = entries
    .filter((e) => e.kind === "income")
    .reduce((s, e) => s + e.amount_cents, 0);
  const expense = entries
    .filter((e) => e.kind === "expense")
    .reduce((s, e) => s + e.amount_cents, 0);
  const housePaid = data.payments
    .filter((p) => p.date.startsWith(month))
    .reduce((s, p) => s + p.amount_cents, 0);
  const end = monthEnd(month);
  const bills = (data.planning?.bills ?? []).filter(
    (b) => !b.paid_entry_id && b.due_date <= end,
  );
  const pendingExpenses = bills
    .filter((b) => b.kind === "expense")
    .reduce((s, b) => s + b.amount_cents, 0);
  const pendingIncome = bills
    .filter((b) => b.kind === "income")
    .reduce((s, b) => s + b.amount_cents, 0);
  const debt = debtSummary(data.settings, data.payments, today);
  const houseReserve =
    month >= today.slice(0, 7)
      ? Math.min(
          debt.remaining,
          Math.max(0, data.settings.installment_cents - housePaid),
        )
      : 0;
  const available =
    income - expense - housePaid - pendingExpenses - houseReserve;
  const daysLeft =
    month === today.slice(0, 7)
      ? Number(end.slice(8)) - Number(today.slice(8)) + 1
      : 0;
  const budgets = (data.planning?.budgets ?? []).map((b) => {
    const spent = entries
      .filter((e) => e.kind === "expense" && e.category === b.category)
      .reduce((s, e) => s + e.amount_cents, 0);
    const committed = bills
      .filter((e) => e.kind === "expense" && e.category === b.category)
      .reduce((s, e) => s + e.amount_cents, 0);
    return {
      ...b,
      spent,
      committed,
      remaining: b.limit_cents - spent - committed,
      percent: ((spent + committed) / b.limit_cents) * 100,
    };
  });
  const unbudgeted = categories.filter(
    (c) =>
      entries.some((e) => e.kind === "expense" && e.category === c) &&
      !budgets.some((b) => b.category === c),
  );
  const lastMonth = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 2, 1),
  )
    .toISOString()
    .slice(0, 7);
  const previousExpense = data.entries
    .filter((e) => e.kind === "expense" && e.date.startsWith(lastMonth))
    .reduce((s, e) => s + e.amount_cents, 0);
  return {
    income,
    expense,
    housePaid,
    pendingExpenses,
    pendingIncome,
    houseReserve,
    available,
    projected: available + pendingIncome,
    dailyLimit: daysLeft ? Math.floor(Math.max(0, available) / daysLeft) : null,
    daysLeft,
    budgets,
    unbudgeted,
    previousExpense,
    overdue: bills.filter((b) => b.kind === "expense" && b.due_date < today),
    bills,
  };
}
export function goalMonthlyNeed(goal: Goal, today = todayBR()) {
  const months = Math.max(
    1,
    (Number(goal.target_date.slice(0, 4)) - Number(today.slice(0, 4))) * 12 +
      Number(goal.target_date.slice(5, 7)) -
      Number(today.slice(5, 7)) +
      1,
  );
  return Math.ceil(Math.max(0, goal.target_cents - goal.saved_cents) / months);
}
export function parseInvitation(input: string) {
  const raw = input.trim();
  if (/^[a-f0-9]{64}$/i.test(raw)) return { activation: raw, username: "" };
  try {
    const url = new URL(raw);
    const params = new URLSearchParams(url.hash.slice(1));
    const activation = params.get("activation") ?? "";
    const username = params.get("user") ?? "";
    if (
      /^[a-f0-9]{64}$/i.test(activation) &&
      ["mark", "andressa", "sidney"].includes(username)
    )
      return { activation, username };
  } catch {}
  return null;
}
