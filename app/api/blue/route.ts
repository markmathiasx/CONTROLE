import { NextResponse } from "next/server";
import { authenticate, cookieName, rpc } from "@/lib/blue/server";
import { csvCell } from "@/lib/blue/domain";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };
export async function GET(request: Request) {
  try {
    const result = await rpc("data");
    if (
      new URL(request.url).searchParams.get("export") === "csv" &&
      result.ok
    ) {
      if (result.user.username !== "mark")
        return NextResponse.json(
          { error: "Somente Mark pode exportar." },
          { status: 403, headers },
        );
      const rows = [
        ["Tipo", "Data", "Descrição", "Categoria", "Valor (R$)", "Responsável"],
        ...result.entries.map(
          (e: {
            kind: string;
            date: string;
            description: string;
            category: string;
            amount_cents: number;
            username: string;
          }) => [
            e.kind === "expense" ? "Despesa" : "Receita",
            e.date,
            e.description,
            e.category,
            (e.amount_cents / 100).toFixed(2).replace(".", ","),
            e.username,
          ],
        ),
        [
          "Casa - saldo inicial",
          "",
          "Pagamentos anteriores sem datas informadas",
          "Moradia",
          (result.settings.opening_paid_cents / 100)
            .toFixed(2)
            .replace(".", ","),
          "",
        ],
        ...result.payments.map(
          (p: {
            date: string;
            note: string;
            amount_cents: number;
            username: string;
          }) => [
            "Casa",
            p.date,
            p.note,
            "Moradia",
            (p.amount_cents / 100).toFixed(2).replace(".", ","),
            p.username,
          ],
        ),
      ];
      return new NextResponse(
        "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n"),
        {
          headers: {
            ...headers,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="controle-financeiro-mmsvh.csv"',
          },
        },
      );
    }
    return NextResponse.json(result, { status: result.status ?? 200, headers });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível conectar ao banco. Tente novamente.",
      },
      { status: 503, headers },
    );
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return NextResponse.json(
      { ok: false, error: "Origem inválida." },
      { status: 403, headers },
    );
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 12000)
      return NextResponse.json(
        { ok: false, error: "Requisição grande demais." },
        { status: 413, headers },
      );
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "JSON inválido." },
        { status: 400, headers },
      );
    }
    const allowed = [
      "login",
      "activate",
      "setup_password",
      "logout",
      "entry_save",
      "entry_delete",
      "payment_save",
      "payment_delete",
      "settings",
      "user",
      "invite",
      "budget_save", "budget_delete", "bill_save", "bill_delete", "bill_pay",
      "goal_save", "goal_delete", "goal_deposit",
    ];
    if (
      !allowed.includes(body.action) ||
      !body.payload ||
      typeof body.payload !== "object" ||
      Array.isArray(body.payload)
    )
      return NextResponse.json(
        { ok: false, error: "Operação inválida." },
        { status: 400, headers },
      );
    const result = ["login", "activate", "setup_password"].includes(body.action)
      ? await authenticate(body.action, body.payload)
      : await rpc(body.action, body.payload);
    const token = result.token;
    delete result.token;
    const response = NextResponse.json(result, {
      status: result.status ?? 200,
      headers,
    });
    if (result.ok && token)
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    if (body.action === "logout")
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Serviço indisponível. Tente novamente em instantes.",
      },
      { status: 503, headers },
    );
  }
}
