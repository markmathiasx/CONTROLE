import { z } from "zod";

import { getOpenAIEnv } from "@/lib/env";
import {
  checkRateLimit,
  enforceSameOrigin,
  jsonNoStore,
  parseJsonBody,
} from "@/lib/server-security";

export const runtime = "nodejs";

const requestSchema = z.object({
  report: z.object({
    style: z.enum(["neutral", "economy", "operational"]),
    headline: z.string(),
    period: z.enum(["day", "week", "month", "year"]),
    periodLabel: z.string(),
    totalIncome: z.number(),
    totalExpense: z.number(),
    net: z.number(),
    topCategories: z.array(
      z.object({
        label: z.string(),
        total: z.number(),
        share: z.number(),
      }),
    ).max(6),
    topCenters: z.array(
      z.object({
        label: z.string(),
        total: z.number(),
      }),
    ).max(6),
    paymentMethods: z.array(
      z.object({
        label: z.string(),
        total: z.number(),
      }),
    ).max(6),
    biggestExpense: z
      .object({
        description: z.string(),
        amount: z.number(),
        date: z.string(),
      })
      .nullable(),
    recommendations: z.array(z.string()).max(8),
    automovel: z.object({
      scopeLabel: z.string(),
      totalCost: z.number(),
      fuelCost: z.number(),
      maintenanceCost: z.number(),
      fixedCostTotal: z.number(),
      monthlyReserveTarget: z.number(),
      coverageWarnings: z.array(z.string()).max(6),
      upcomingItems: z.array(
        z.object({
          title: z.string(),
          amount: z.number(),
          dueDate: z.string().nullable().optional(),
        }),
      ).max(6),
    }),
  }),
  monthlyComparisons: z.array(
    z.object({
      label: z.string(),
      current: z.number(),
      previous: z.number(),
      delta: z.number(),
      deltaPercent: z.number(),
    }),
  ).max(6),
});

const responseSchema = z.object({
  title: z.string().min(1),
  overview: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  priorities: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      impact: z.string(),
    }),
  ).min(2).max(4),
  cuts: z.array(
    z.object({
      label: z.string(),
      reason: z.string(),
      impact: z.string(),
    }),
  ).min(1).max(4),
  nextActions: z.array(z.string()).min(2).max(5),
  caution: z.string().min(1),
});

function getResponseSchemaJson() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "overview", "riskLevel", "priorities", "cuts", "nextActions", "caution"],
    properties: {
      title: { type: "string" },
      overview: { type: "string" },
      riskLevel: { type: "string", enum: ["low", "medium", "high"] },
      priorities: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "reason", "impact"],
          properties: {
            title: { type: "string" },
            reason: { type: "string" },
            impact: { type: "string" },
          },
        },
      },
      cuts: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "reason", "impact"],
          properties: {
            label: { type: "string" },
            reason: { type: "string" },
            impact: { type: "string" },
          },
        },
      },
      nextActions: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: { type: "string" },
      },
      caution: { type: "string" },
    },
  };
}

function extractOutputText(payload: unknown) {
  if (payload && typeof payload === "object" && "output_text" in payload) {
    const value = (payload as { output_text?: unknown }).output_text;
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  if (payload && typeof payload === "object" && "output" in payload) {
    const output = (payload as { output?: unknown }).output;
    if (Array.isArray(output)) {
      const text = output
        .flatMap((item) =>
          item && typeof item === "object" && "content" in item
            ? ((item as { content?: unknown }).content as unknown[])
            : [],
        )
        .map((item) =>
          item && typeof item === "object" && "text" in item
            ? (item as { text?: unknown }).text
            : null,
        )
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .join("\n")
        .trim();

      if (text) {
        return text;
      }
    }
  }

  return "";
}

export async function POST(request: Request) {
  const sameOriginResponse = enforceSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const rateLimitResponse = checkRateLimit(request, {
    key: "ai-financial-review",
    max: 8,
    windowMs: 60_000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody<unknown>(request, { maxBytes: 200_000 });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const bodyResult = requestSchema.safeParse(parsedBody.data);
  if (!bodyResult.success) {
    return jsonNoStore(
      { ok: false, error: "Os dados enviados para a análise IA estão incompletos." },
      { status: 400 },
    );
  }

  const openAIEnv = getOpenAIEnv();
  if (!openAIEnv) {
    return jsonNoStore(
      { ok: false, error: "A análise IA só fica disponível quando OPENAI_API_KEY estiver configurada no servidor." },
      { status: 503 },
    );
  }

  const { report, monthlyComparisons } = bodyResult.data;
  const systemPrompt = [
    "Você é um analista financeiro pessoal e operacional para um app brasileiro de gastos.",
    "Responda em português do Brasil.",
    "Use somente os dados enviados.",
    "Não invente números nem eventos.",
    "Priorize clareza, objetividade e utilidade prática.",
    "Considere o modelo escolhido no campo report.style:",
    "- neutral: equilíbrio geral",
    "- economy: foco em corte de gastos",
    "- operational: foco em disciplina operacional e previsibilidade",
  ].join(" ");

  const userPayload = {
    report,
    monthlyComparisons,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIEnv.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAIEnv.model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(userPayload),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "financial_review",
          schema: getResponseSchemaJson(),
          strict: true,
        },
      },
    }),
  });

  const raw = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      raw && typeof raw === "object" && "error" in raw
        ? ((raw as { error?: { message?: string } }).error?.message ?? "Falha ao chamar a OpenAI.")
        : "Falha ao chamar a OpenAI.";

    return jsonNoStore({ ok: false, error: message }, { status: response.status });
  }

  const outputText = extractOutputText(raw);
  if (!outputText) {
    return jsonNoStore(
      { ok: false, error: "A OpenAI não devolveu texto utilizável para esta análise." },
      { status: 502 },
    );
  }

  try {
    const parsed = responseSchema.parse(JSON.parse(outputText));
    return jsonNoStore({ ok: true, review: parsed });
  } catch {
    return jsonNoStore(
      { ok: false, error: "A resposta da IA veio fora do formato esperado." },
      { status: 502 },
    );
  }
}
