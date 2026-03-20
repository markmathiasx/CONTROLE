import { describe, expect, it } from "vitest";

import { buildCatalogProducts, buildCatalogWhatsAppMessage, getCatalogOverview } from "@/utils/catalog";
import { createSeedSnapshot } from "@/utils/seed";

describe("catalog helpers", () => {
  it("builds product list with pricing and stock status", () => {
    const snapshot = createSeedSnapshot("local");
    const products = buildCatalogProducts(snapshot);
    const first = products[0];

    expect(products.length).toBeGreaterThan(5);
    expect(first.pricePix).toBeGreaterThan(0);
    expect(first.priceCard).toBeGreaterThan(first.pricePix);
    expect(["low", "medium", "high"]).toContain(first.stockRisk);
  });

  it("creates overview totals", () => {
    const snapshot = createSeedSnapshot("local");
    const products = buildCatalogProducts(snapshot);
    const overview = getCatalogOverview(products);

    expect(overview.productCount).toBe(products.length);
    expect(overview.projectedPixRevenue).toBeGreaterThan(0);
    expect(overview.projectedCardRevenue).toBeGreaterThan(0);
  });

  it("builds whatsapp message with subtotal and lines", () => {
    const message = buildCatalogWhatsAppMessage(
      [
        {
          productId: "a",
          name: "Produto A",
          unitPricePix: 50,
          unitPriceCard: 60,
          quantity: 2,
        },
        {
          productId: "b",
          name: "Produto B",
          unitPricePix: 30,
          unitPriceCard: 35,
          quantity: 1,
        },
      ],
      { customerName: "Marcos" },
    );

    expect(message).toContain("Cliente: Marcos");
    expect(message).toContain("Subtotal Pix: R$ 130.00");
    expect(message).toContain("Subtotal Cartão: R$ 155.00");
  });
});
