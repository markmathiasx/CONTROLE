import { describe, expect, it } from "vitest";

import type { CreditCard, Transaction } from "@/types/domain";
import { generateInstallmentsForTransaction, getFirstInvoiceMonth } from "@/utils/installments";

const card: CreditCard = {
  id: "card_1",
  workspaceId: "w",
  name: "Nubank",
  brand: "Mastercard",
  last4: "1234",
  limit: 2000,
  bestPurchaseDay: 12,
  dueDay: 19,
  color: "#8b5cf6",
  aliases: ["nu"],
  active: true,
  createdAt: "",
  updatedAt: "",
};

const transaction: Transaction = {
  id: "tx_1",
  workspaceId: "w",
  centerId: "center_me",
  categoryId: "cat",
  description: "Compra parcelada",
  amount: 300,
  paymentMethod: "credit",
  transactionDate: "2026-03-13",
  cardId: "card_1",
  installments: 3,
  originModule: "finance",
  originRefId: null,
  lockedByOrigin: false,
  createdAt: "2026-03-13T10:00:00Z",
  updatedAt: "2026-03-13T10:00:00Z",
};

describe("installments", () => {
  it("joga a primeira parcela para o mês seguinte quando compra no melhor dia ou depois", () => {
    expect(getFirstInvoiceMonth("2026-03-13", 12)).toBe("2026-04");
  });

  it("gera parcelas mensais com o valor correto", () => {
    const installments = generateInstallmentsForTransaction({
      transaction,
      card,
      workspaceId: "w",
      createdAt: "2026-03-13T10:00:00Z",
    });

    expect(installments).toHaveLength(3);
    expect(installments.map((item) => item.invoiceMonth)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(installments.map((item) => item.amount)).toEqual([100, 100, 100]);
  });
});
