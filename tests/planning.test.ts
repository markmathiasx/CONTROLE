import { describe, it, expect } from "vitest";
import {
  goalMonthlyNeed,
  monthEnd,
  parseInvitation,
  planningSummary,
} from "@/lib/blue/planning";
import type { BlueData } from "@/lib/blue/domain";
const data: BlueData = {
  user: {
    id: "mark",
    username: "mark",
    name: "Mark",
    role: "admin",
    active: true,
    first_login: false,
  },
  users: [],
  entries: [
    {
      id: "1",
      description: "Renda",
      amount_cents: 500000,
      category: "Salário",
      date: "2026-10-01",
      user_id: "mark",
      kind: "income",
    },
    {
      id: "2",
      description: "Mercado",
      amount_cents: 40000,
      category: "Alimentação",
      date: "2026-10-02",
      user_id: "mark",
      kind: "expense",
    },
  ],
  payments: [],
  settings: {
    total_cents: 8000000,
    opening_paid_cents: 300000,
    opening_installments: 2,
    installment_cents: 150000,
    due_day: 10,
  },
  planning: {
    budgets: [{ category: "Alimentação", limit_cents: 50000 }],
    goals: [],
    bills: [
      {
        id: "b",
        title: "Mercado",
        amount_cents: 10000,
        category: "Alimentação",
        due_date: "2026-10-10",
        kind: "expense",
        repeat_monthly: false,
        installment_count: 1,
        installment_index: 1,
        user_id: "mark",
        paid_entry_id: null,
        paid_at: null,
      },
    ],
  },
};
describe("MMSVH spending guardrails", () => {
  it("reserves household obligations and calculates a conservative daily limit", () => {
    const s = planningSummary(data, "2026-10", "2026-10-06");
    expect(s.available).toBe(300000);
    expect(s.daysLeft).toBe(26);
    expect(s.dailyLimit).toBe(11538);
    expect(s.budgets[0]).toMatchObject({
      spent: 40000,
      committed: 10000,
      percent: 100,
      remaining: 0,
    });
  });
  it("does not reserve the house twice after a payment or pending income as actual cash", () => {
    const s = planningSummary(
      {
        ...data,
        payments: [
          {
            id: "p",
            amount_cents: 150000,
            date: "2026-10-05",
            user_id: "mark",
            note: "",
          },
        ],
        planning: {
          ...data.planning!,
          bills: [
            ...data.planning!.bills,
            {
              ...data.planning!.bills[0],
              id: "i",
              kind: "income",
              amount_cents: 100000,
            },
          ],
        },
      },
      "2026-10",
      "2026-10-06",
    );
    expect(s.houseReserve).toBe(0);
    expect(s.available).toBe(300000);
    expect(s.projected).toBe(400000);
  });
  it("includes overdue unpaid commitments and clamps negative daily cash to zero", () => {
    const s = planningSummary(
      {
        ...data,
        entries: [],
        planning: {
          ...data.planning!,
          bills: [{ ...data.planning!.bills[0], due_date: "2026-09-10" }],
        },
      },
      "2026-10",
      "2026-10-06",
    );
    expect(s.overdue).toHaveLength(1);
    expect(s.pendingExpenses).toBe(10000);
    expect(s.dailyLimit).toBe(0);
  });
  it("handles leap years, year boundaries and achieved goals", () => {
    expect(monthEnd("2028-02")).toBe("2028-02-29");
    expect(
      goalMonthlyNeed(
        {
          id: "g",
          title: "Reserva",
          target_cents: 100000,
          saved_cents: 40000,
          target_date: "2027-01-01",
          user_id: "mark",
        },
        "2026-11-01",
      ),
    ).toBe(20000);
    expect(
      planningSummary(data, "2026-09", "2026-10-06").dailyLimit,
    ).toBeNull();
  });
  it("reads per-person invitations without putting credentials in query strings", () => {
    const token = "a".repeat(64);
    expect(
      parseInvitation(
        `https://controle-blue.vercel.app/auth/setup-password#user=sidney&activation=${token}`,
      ),
    ).toEqual({ username: "sidney", activation: token });
    expect(parseInvitation(token)).toEqual({ username: "", activation: token });
    expect(
      parseInvitation("https://example.test/#user=someone&activation=" + token),
    ).toBeNull();
    expect(parseInvitation("incomplete-token")).toBeNull();
  });
});
