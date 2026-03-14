import { describe, expect, it } from "vitest";

import { categoryPresets } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { Category, CostCenter, CreditCard } from "@/types/domain";
import { parseQuickEntry } from "@/utils/quick-entry";

const centers: CostCenter[] = [
  {
    id: "me",
    workspaceId: "w",
    kind: "me",
    name: "Eu",
    color: "#10b981",
    icon: "wallet",
    active: true,
    module: "finance",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "partner",
    workspaceId: "w",
    kind: "partner",
    name: "Namorada",
    color: "#06b6d4",
    icon: "heart-handshake",
    active: true,
    module: "finance",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "shared",
    workspaceId: "w",
    kind: "shared",
    name: "Casal",
    color: "#8b5cf6",
    icon: "home",
    active: true,
    module: "shared",
    createdAt: "",
    updatedAt: "",
  },
];

const categories: Category[] = categoryPresets.slice(0, 6).map((preset, index) => ({
  id: `cat-${index}`,
  workspaceId: "w",
  name: preset.name,
  slug: slugify(preset.name),
  color: preset.color,
  icon: preset.icon,
  keywords: preset.keywords,
  budgetable: preset.budgetable,
  system: true,
  scope: preset.scope,
  createdAt: "",
  updatedAt: "",
}));

const cards: CreditCard[] = [
  {
    id: "nu",
    workspaceId: "w",
    name: "Nubank",
    brand: "Mastercard",
    last4: "5472",
    limit: 2000,
    bestPurchaseDay: 12,
    dueDay: 19,
    color: "#8b5cf6",
    aliases: ["nubank", "nu", "roxinho"],
    active: true,
    createdAt: "",
    updatedAt: "",
  },
];

describe("parseQuickEntry", () => {
  it("interpreta compra parcelada do casal", () => {
    const result = parseQuickEntry("300 credito 3x mercado casal", {
      cards,
      categories,
      costCenters: centers,
      defaultCenterId: "me",
    });

    expect(result.amount).toBe(300);
    expect(result.paymentMethod).toBe("credit");
    expect(result.installments).toBe(3);
    expect(result.centerId).toBe("shared");
    expect(result.categoryId).toBe(categories.find((item) => item.slug === "mercado")?.id);
    expect(result.warnings).toContain("Selecione um cartão para distribuir as parcelas.");
  });

  it("entende centro da namorada e método pix", () => {
    const result = parseQuickEntry("42 pix bebida namorada", {
      cards,
      categories,
      costCenters: centers,
      defaultCenterId: "me",
    });

    expect(result.amount).toBe(42);
    expect(result.paymentMethod).toBe("pix");
    expect(result.centerId).toBe("partner");
    expect(result.categoryId).toBe(categories.find((item) => item.slug === "bebidas")?.id);
  });
});
