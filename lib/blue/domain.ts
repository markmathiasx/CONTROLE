export type Role = "admin" | "user" | "viewer";
export type BlueUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
  first_login: boolean;
};
export type Entry = {
  id: string;
  description: string;
  amount_cents: number;
  category: string;
  date: string;
  user_id: string;
  kind: "expense" | "income";
  username?: string;
};
export type HousePayment = {
  id: string;
  amount_cents: number;
  date: string;
  user_id: string;
  note: string;
  username?: string;
};
export type HouseSettings = {
  total_cents: number;
  installment_cents: number;
  opening_paid_cents: number;
  opening_installments: number;
  due_day: number;
};
export type BlueData = {
  user: BlueUser;
  users: BlueUser[];
  entries: Entry[];
  payments: HousePayment[];
  settings: HouseSettings;
};
export const categories = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Lazer",
  "Compras",
  "Salário",
  "Outros",
];
export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  user: "Colaboradora / colaborador",
  viewer: "Visualizador",
};
export const currency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const todayBR = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function parseMoney(input: string) {
  const cleaned = input.trim().replace(/R\$\s?/, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Informe um valor válido, como 1.500,00.");
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100000000)
    throw new Error("O valor deve ser positivo e de até R$ 1.000.000.");
  return cents;
}
export function canEdit(user: BlueUser, owner: string) {
  return user.role === "admin" || (user.role === "user" && user.id === owner);
}
export function debtSummary(
  settings: HouseSettings,
  payments: HousePayment[],
  asOf = todayBR(),
) {
  const recorded = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const paid = settings.opening_paid_cents + recorded;
  const remaining = Math.max(0, settings.total_cents - paid);
  const remainingInstallments = Math.ceil(
    remaining / settings.installment_cents,
  );
  const paidInstallments =
    settings.opening_installments +
    Math.floor(recorded / settings.installment_cents);
  const [year, month, day] = asOf.split("-").map(Number);
  // The next scheduled due date is this month if it has not passed and no payment was made this month.
  const paidThisMonth = payments.some(
    (p) => p.date.slice(0, 7) === asOf.slice(0, 7),
  );
  const nextOffset = day > settings.due_day || paidThisMonth ? 1 : 0;
  const finish = new Date(
    Date.UTC(
      year,
      month - 1 + nextOffset + Math.max(0, remainingInstallments - 1),
      1,
    ),
  );
  const payoff =
    remaining === 0
      ? "Quitada"
      : new Intl.DateTimeFormat("pt-BR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(finish);
  const lastInstallment =
    remaining === 0
      ? 0
      : remaining % settings.installment_cents || settings.installment_cents;
  return {
    paid,
    remaining,
    remainingInstallments,
    paidInstallments,
    payoff,
    lastInstallment,
    progress: Math.min(100, (paid / settings.total_cents) * 100),
    nearPayoff: remaining > 0 && remainingInstallments <= 12,
  };
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""') +
    '"'
  );
}
