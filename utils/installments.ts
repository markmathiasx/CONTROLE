import {
  addMonths,
  endOfMonth,
  format,
  getDate,
  parseISO,
  setDate,
  startOfMonth,
} from "date-fns";

import type { CreditCard, Transaction, TransactionInstallment } from "@/types/domain";
import { createId, roundCurrency } from "@/lib/utils";

function getDueDate(invoiceMonth: string, dueDay: number) {
  const monthDate = parseISO(`${invoiceMonth}-01`);
  const maxDay = getDate(endOfMonth(monthDate));
  return format(setDate(startOfMonth(monthDate), Math.min(dueDay, maxDay)), "yyyy-MM-dd");
}

export function getFirstInvoiceMonth(transactionDate: string, bestPurchaseDay: number) {
  const date = parseISO(transactionDate);
  const startMonth = startOfMonth(date);
  const base = getDate(date) >= bestPurchaseDay ? addMonths(startMonth, 1) : startMonth;
  return format(base, "yyyy-MM");
}

export function generateInstallmentsForTransaction(params: {
  transaction: Transaction;
  card: CreditCard;
  workspaceId: string;
  createdAt?: string;
  actorUserId?: string | null;
}): TransactionInstallment[] {
  const { transaction, card, workspaceId } = params;
  const createdAt = params.createdAt ?? transaction.updatedAt;
  const actorUserId = params.actorUserId ?? transaction.updatedByUserId ?? transaction.createdByUserId ?? null;
  const totalInstallments = Math.max(1, transaction.installments);
  const baseAmount = roundCurrency(transaction.amount / totalInstallments);
  const remainder = roundCurrency(transaction.amount - baseAmount * totalInstallments);
  const firstInvoiceMonth = getFirstInvoiceMonth(
    transaction.transactionDate,
    card.bestPurchaseDay,
  );
  const firstMonthDate = parseISO(`${firstInvoiceMonth}-01`);

  return Array.from({ length: totalInstallments }, (_, index) => {
    const monthDate = addMonths(firstMonthDate, index);
    const invoiceMonth = format(monthDate, "yyyy-MM");
    const amount =
      index === totalInstallments - 1
        ? roundCurrency(baseAmount + remainder)
        : baseAmount;

    return {
      id: createId("inst"),
      createdAt,
      updatedAt: createdAt,
      workspaceId,
      transactionId: transaction.id,
      cardId: card.id,
      categoryId: transaction.categoryId,
      centerId: transaction.centerId,
      amount,
      installmentNumber: index + 1,
      totalInstallments,
      invoiceMonth,
      dueDate: getDueDate(invoiceMonth, card.dueDay),
      transactionDate: transaction.transactionDate,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };
  });
}
