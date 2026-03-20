import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRuntimeConfig: vi.fn(),
  getOpenAIEnv: vi.fn(),
  getSupabaseRouteHandlerClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRuntimeConfig: mocks.getRuntimeConfig,
  getOpenAIEnv: mocks.getOpenAIEnv,
}));

vi.mock("@/services/supabase/server", () => ({
  getSupabaseRouteHandlerClient: mocks.getSupabaseRouteHandlerClient,
}));

import { POST as financialReviewPost } from "@/app/api/ai/financial-review/route";

function buildValidBody() {
  return {
    report: {
      style: "neutral",
      headline: "Resumo",
      period: "month",
      periodLabel: "Março/2026",
      totalIncome: 2000,
      totalExpense: 1200,
      net: 800,
      topCategories: [{ label: "Alimentação", total: 400, share: 33.3 }],
      topCenters: [{ label: "Eu", total: 700 }],
      paymentMethods: [{ label: "Pix", total: 500 }],
      biggestExpense: {
        description: "Supermercado",
        amount: 350,
        date: "2026-03-05",
      },
      recommendations: ["Acompanhar metas", "Reduzir supérfluos"],
      automovel: {
        scopeLabel: "Todos os veículos",
        totalCost: 300,
        fuelCost: 220,
        maintenanceCost: 60,
        fixedCostTotal: 20,
        monthlyReserveTarget: 50,
        coverageWarnings: [],
        upcomingItems: [],
      },
    },
    monthlyComparisons: [
      {
        label: "Despesa",
        current: 1200,
        previous: 1000,
        delta: 200,
        deltaPercent: 20,
      },
    ],
  };
}

describe("ai financial review route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exige sessão autenticada quando o modo nuvem está ativo", async () => {
    mocks.getRuntimeConfig.mockReturnValue({
      storageMode: "supabase",
      hasSupabase: true,
      hasPinLock: false,
      hasUsernameAuth: true,
      hasOpenAI: true,
    });
    mocks.getOpenAIEnv.mockReturnValue({
      apiKey: "test-key",
      model: "gpt-5.4",
    });
    mocks.getSupabaseRouteHandlerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const response = await financialReviewPost(
      new Request("http://localhost/api/ai/financial-review", {
        method: "POST",
        body: JSON.stringify(buildValidBody()),
      }),
    );
    const payload = (await response.json()) as { ok?: boolean; error?: string };

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("Faça login");
  });

  it("mantém fallback local sem exigir auth quando Supabase não está ativo", async () => {
    mocks.getRuntimeConfig.mockReturnValue({
      storageMode: "local",
      hasSupabase: false,
      hasPinLock: false,
      hasUsernameAuth: false,
      hasOpenAI: false,
    });
    mocks.getOpenAIEnv.mockReturnValue(null);

    const response = await financialReviewPost(
      new Request("http://localhost/api/ai/financial-review", {
        method: "POST",
        body: JSON.stringify(buildValidBody()),
      }),
    );
    const payload = (await response.json()) as { ok?: boolean; error?: string };

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("OPENAI_API_KEY");
    expect(mocks.getSupabaseRouteHandlerClient).not.toHaveBeenCalled();
  });
});

