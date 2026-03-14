import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrencyBRL(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactCurrencyBRL(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatDateBR(value: string) {
  return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateShort(value: string) {
  return format(parseISO(value), "dd MMM", { locale: ptBR });
}

export function formatMonthLabel(value: string) {
  return format(parseISO(`${value}-01`), "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatMonthShortLabel(value: string) {
  return format(parseISO(`${value}-01`), "MMM/yy", { locale: ptBR });
}

export function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}
