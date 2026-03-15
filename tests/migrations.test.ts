import { describe, expect, it } from "vitest";

import { parseWorkspaceSnapshot } from "@/lib/snapshot-migrations";
import { createSeedSnapshot } from "@/utils/seed";

describe("snapshot migrations", () => {
  it("migra snapshot legado v1 para cost centers e schema v3", () => {
    const seeded = createSeedSnapshot("local");
    const legacy = {
      ...seeded,
      profiles: seeded.costCenters
        .filter((item) => ["me", "partner", "shared"].includes(item.kind))
        .map((center) => ({
          id: center.id,
          workspaceId: center.workspaceId,
          kind: center.kind,
          name: center.name,
          color: center.color,
          icon: center.icon,
          active: center.active,
          createdAt: center.createdAt,
          updatedAt: center.updatedAt,
        })),
      transactions: seeded.transactions.map((tx) => ({
        id: tx.id,
        workspaceId: tx.workspaceId,
        profileId: tx.centerId,
        categoryId: tx.categoryId,
        description: tx.description,
        notes: tx.notes,
        amount: tx.amount,
        paymentMethod: tx.paymentMethod,
        transactionDate: tx.transactionDate,
        cardId: tx.cardId,
        installments: tx.installments,
        recurrenceRuleId: tx.recurrenceRuleId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })),
      installments: seeded.installments.map((item) => ({
        ...item,
        profileId: item.centerId,
      })),
      incomes: seeded.incomes.map((income) => ({
        id: income.id,
        workspaceId: income.workspaceId,
        profileId: income.centerId,
        description: income.description,
        amount: income.amount,
        incomeType: income.incomeType,
        wallet: income.wallet,
        receivedAt: income.receivedAt,
        notes: income.notes,
        recurrenceRuleId: income.recurrenceRuleId,
        createdAt: income.createdAt,
        updatedAt: income.updatedAt,
      })),
      recurrences: seeded.recurrences.map((rule) => ({
        ...rule,
        profileId: rule.centerId,
      })),
      settings: {
        ...seeded.settings,
        activeProfileIds: seeded.settings.activeCenterIds,
      },
    };

    delete (legacy as Record<string, unknown>).costCenters;
    const parsed = parseWorkspaceSnapshot(legacy);

    expect(parsed.meta.schemaVersion).toBe(3);
    expect(parsed.costCenters).toHaveLength(5);
    expect(parsed.transactions[0]).toHaveProperty("centerId");
    expect(parsed.incomes[0]).toHaveProperty("centerId");
    expect(parsed.user).toHaveProperty("username");
    expect(parsed.meta).toHaveProperty("migrationOrigin");
  });
});
