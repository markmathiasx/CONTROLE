import { format } from "date-fns";

import { normalizeText, safeNumber } from "@/lib/utils";
import type {
  CostCenter,
  PaymentMethod,
  QuickEntryContext,
  QuickEntryDraft,
} from "@/types/domain";

const paymentAliases: Record<string, PaymentMethod> = {
  credito: "credit",
  crédito: "credit",
  cred: "credit",
  credit: "credit",
  debito: "debit",
  débito: "debit",
  debit: "debit",
  pix: "pix",
  vr: "vr",
  vale: "vr",
  dinheiro: "cash",
  cash: "cash",
};

const centerAliases = {
  partner: ["namorada", "amor", "ela"],
  shared: ["casal", "casa", "nos", "nós", "lar"],
  moto: ["moto", "cg", "gasolina", "automovel", "automóvel", "veiculo", "veículo", "carro"],
  store: ["loja", "pedido", "filamento", "impressao", "impressão", "3d"],
};

function findCenterIdByKind(
  centers: CostCenter[],
  kind: CostCenter["kind"],
  fallbackId: string,
) {
  return centers.find((center) => center.kind === kind)?.id ?? fallbackId;
}

function matchCenterId(tokens: string[], centers: CostCenter[], defaultCenterId: string) {
  const normalized = tokens.map((token) => normalizeText(token));

  if (normalized.some((token) => centerAliases.partner.includes(token))) {
    return findCenterIdByKind(centers, "partner", defaultCenterId);
  }

  if (normalized.some((token) => centerAliases.shared.includes(token))) {
    return findCenterIdByKind(centers, "shared", defaultCenterId);
  }

  if (normalized.some((token) => centerAliases.moto.includes(token))) {
    return findCenterIdByKind(centers, "moto", defaultCenterId);
  }

  if (normalized.some((token) => centerAliases.store.includes(token))) {
    return findCenterIdByKind(centers, "store", defaultCenterId);
  }

  return defaultCenterId;
}

export function parseQuickEntry(
  input: string,
  context: QuickEntryContext,
): QuickEntryDraft {
  const rawText = input.trim();
  const normalized = normalizeText(rawText);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const warnings: string[] = [];
  const amountMatch = rawText.match(/(\d+([.,]\d+)?)/);
  const amount = amountMatch ? safeNumber(amountMatch[1]) : null;

  if (!amount || amount <= 0) {
    warnings.push("Informe um valor para continuar.");
  }

  const installmentsMatch = normalized.match(/\b(\d+)x\b/);
  const installments = installmentsMatch ? Math.max(1, Number(installmentsMatch[1])) : 1;

  const paymentMethod =
    tokens.map((token) => paymentAliases[token]).find(Boolean) ?? "debit";

  const centerId = matchCenterId(tokens, context.costCenters, context.defaultCenterId);

  const category = context.categories.find((item) => {
    const haystack = [item.name, ...item.keywords].map(normalizeText);
    return tokens.some((token) => haystack.some((entry) => entry.includes(token)));
  });

  const card = context.cards.find((item) => {
    const haystack = [item.name, ...item.aliases].map(normalizeText);
    return tokens.some((token) => haystack.some((entry) => entry.includes(token)));
  });

  const ignored = new Set<string>();
  if (amountMatch) {
    ignored.add(normalizeText(amountMatch[1]));
  }

  if (installmentsMatch) {
    ignored.add(normalizeText(installmentsMatch[0]));
  }

  tokens.forEach((token) => {
    if (paymentAliases[token]) {
      ignored.add(token);
    }
  });

  Object.values(centerAliases)
    .flat()
    .forEach((alias) => ignored.add(normalizeText(alias)));

  category?.keywords.forEach((keyword) => ignored.add(normalizeText(keyword)));
  if (category) {
    ignored.add(normalizeText(category.name));
  }

  card?.aliases.forEach((alias) => ignored.add(normalizeText(alias)));
  if (card) {
    ignored.add(normalizeText(card.name));
  }

  const description = rawText
    .split(/\s+/)
    .filter((token) => !ignored.has(normalizeText(token)))
    .join(" ")
    .trim();

  if (paymentMethod === "credit" && installments > 1 && !card) {
    warnings.push("Selecione um cartão para distribuir as parcelas.");
  }

  return {
    kind: "expense",
    amount,
    description: description || (category ? category.name : "Gasto rápido"),
    paymentMethod,
    centerId,
    categoryId: category?.id,
    cardId: card?.id,
    installments,
    transactionDate: format(new Date(), "yyyy-MM-dd"),
    rawText,
    warnings,
  };
}
