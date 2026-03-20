"use client";

import * as React from "react";

import type { CatalogCartItem, CatalogProduct } from "@/utils/catalog";

const storageKey = "mmsvh:catalog-cart:v1";

function toStorageItems(value: unknown): CatalogCartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      if (
        typeof record.productId !== "string" ||
        typeof record.name !== "string" ||
        typeof record.unitPricePix !== "number" ||
        typeof record.unitPriceCard !== "number" ||
        typeof record.quantity !== "number"
      ) {
        return null;
      }

      return {
        productId: record.productId,
        name: record.name,
        unitPricePix: record.unitPricePix,
        unitPriceCard: record.unitPriceCard,
        quantity: Math.max(1, Math.round(record.quantity)),
      } satisfies CatalogCartItem;
    })
    .filter((item): item is CatalogCartItem => Boolean(item));
}

export function useCatalogCart() {
  const [items, setItems] = React.useState<CatalogCartItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      setItems(toStorageItems(parsed));
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const totals = React.useMemo(() => {
    return {
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      pix: items.reduce((sum, item) => sum + item.quantity * item.unitPricePix, 0),
      card: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCard, 0),
    };
  }, [items]);

  function addProduct(product: CatalogProduct, quantity = 1) {
    setItems((current) => {
      const nextQuantity = Math.max(1, Math.round(quantity));
      const index = current.findIndex((item) => item.productId === product.id);
      if (index >= 0) {
        const next = [...current];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + nextQuantity,
        };
        return next;
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unitPricePix: product.pricePix,
          unitPriceCard: product.priceCard,
          quantity: nextQuantity,
        },
      ];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(0, Math.round(quantity)),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeProduct(productId: string) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  return {
    hydrated,
    items,
    totals,
    addProduct,
    setQuantity,
    removeProduct,
    clear,
  };
}
