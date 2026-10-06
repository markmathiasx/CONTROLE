"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HouseProgressCard } from "./house-progress-card";
import {
  Wallet,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  Settings,
  LogOut,
  Plus,
  ChevronRight,
  ShieldCheck,
  Download,
  Sun,
  Moon,
  X,
  Pencil,
  Trash2,
  TrendingUp,
  CalendarDays,
  Check,
  Copy,
  PieChart as ChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BlueData,
  Entry,
  HousePayment,
  Role,
  canEdit,
  categories,
  currency,
  debtSummary,
  parseMoney,
  roleLabels,
  todayBR,
} from "@/lib/blue/domain";
type Tab = "dashboard" | "gastos" | "casa" | "configuracoes" | "relatorios";
type Draft = {
  type: "entry" | "payment";
  id: string;
  amount: string;
  date: string;
  description: string;
  category: string;
  kind: "expense" | "income";
};
const colors = [
  "#2563eb",
  "#63a0ff",
  "#1ac1a4",
  "#f6b95f",
  "#a08bfa",
  "#f281ad",
  "#8698b2",
  "#dae3f0",
];
const links = [
  { href: "/", tab: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/gastos", tab: "gastos", label: "Movimentações", icon: Wallet },
  { href: "/casa", tab: "casa", label: "Nossa casa", icon: Home },
  {
    href: "/relatorios",
    tab: "relatorios",
    label: "Relatórios",
    icon: ChartIcon,
  },
  {
    href: "/configuracoes",
    tab: "configuracoes",
    label: "Configurações",
    icon: Settings,
  },
] as const;
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
export function BlueApp({ initial, tab }: { initial: BlueData; tab: Tab }) {
  const [data, setData] = useState(initial),
    [month, setMonth] = useState(todayBR().slice(0, 7)),
    [category, setCategory] = useState(""),
    [responsible, setResponsible] = useState(""),
    [draft, setDraft] = useState<Draft | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<{ text: string; error?: boolean } | null>(
      null,
    ),
    [dark, setDark] = useState(false),
    [connected, setConnected] = useState(true),
    [lastSync, setLastSync] = useState(Date.now()),
    [period, setPeriod] = useState({ from: "", to: "" }),
    [invite, setInvite] = useState(""),
    [adminPassword, setAdminPassword] = useState(""),
    [adminUser, setAdminUser] = useState("andressa"),
    [settings, setSettings] = useState({
      total: String(initial.settings.total_cents / 100),
      installment: String(initial.settings.installment_cents / 100),
      due: String(initial.settings.due_day),
    }),
    [year, setYear] = useState(todayBR().slice(0, 4));
  const inFlight = useRef(false),
    dialog = useRef<HTMLDialogElement>(null);
  const user = data.user,
    admin = user.username === "mark",
    editor = user.role !== "viewer";
  const notify = (text: string, error = false) => setMessage({ text, error });
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const r = await fetch("/api/blue", { cache: "no-store" });
      const d = await r.json();
      if (r.status === 401) {
        location.assign("/login");
        return;
      }
      if (!d.ok) throw new Error();
      setData(d);
      setConnected(true);
      setLastSync(Date.now());
    } catch {
      setConnected(false);
    } finally {
      inFlight.current = false;
    }
  }, []);
  useEffect(() => {
    const theme = localStorage.getItem("blue-theme") === "dark";
    setDark(theme);
    document.documentElement.dataset.theme = theme ? "dark" : "light";
    // Retire the old service worker: financial responses must never be cached across accounts.
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker
        .getRegistrations()
        .then((list) => Promise.all(list.map((r) => r.unregister())));
    if ("caches" in window)
      void caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => /workbox|pwa|next|start-url|pages/i.test(k))
              .map((k) => caches.delete(k)),
          ),
        );
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (draft) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [draft]);
  async function mutate(
    action: string,
    payload: Record<string, unknown>,
    success = "Salvo com sucesso.",
  ) {
    setBusy(true);
    try {
      const r = await fetch(
        action === "reset_password" ? "/api/admin/reset-password" : "/api/blue",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload }),
        },
      );
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      notify(success);
      await refresh();
      return d;
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível salvar.", true);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/blue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", payload: {} }),
      });
      if (!r.ok && r.status !== 401) throw new Error();
      location.assign("/login");
    } catch {
      notify("Não foi possível encerrar a sessão. Tente novamente.", true);
      setBusy(false);
    }
  }
  function newDraft(type: "entry" | "payment", record?: Entry | HousePayment) {
    setDraft({
      type,
      id: record?.id ?? crypto.randomUUID(),
      amount: record ? String(record.amount_cents / 100) : "",
      date: record?.date ?? todayBR(),
      description: record
        ? "description" in record
          ? record.description
          : record.note
        : "",
      category:
        record && "category" in record ? record.category : "Alimentação",
      kind: record && "kind" in record ? record.kind : "expense",
    });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    try {
      const amount = parseMoney(draft.amount);
      const result = await mutate(
        draft.type === "entry" ? "entry_save" : "payment_save",
        {
          id: draft.id,
          amount_cents: amount,
          date: draft.date,
          description: draft.description,
          note: draft.description,
          category: draft.category,
          kind: draft.kind,
        },
      );
      if (result) setDraft(null);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Valor inválido.", true);
    }
  }
  async function remove(type: "entry" | "payment", id: string) {
    if (!confirm("Excluir este lançamento? Esta alteração afetará os totais."))
      return;
    await mutate(type + "_delete", { id }, "Lançamento excluído.");
  }
  const debt = debtSummary(data.settings, data.payments);
  const monthEntries = data.entries.filter((e) => e.date.startsWith(month));
  const filtered = monthEntries.filter(
    (e) =>
      (!category || e.category === category) &&
      (!responsible || e.user_id === responsible),
  );
  const income = monthEntries
      .filter((e) => e.kind === "income")
      .reduce((s, e) => s + e.amount_cents, 0),
    expense = monthEntries
      .filter((e) => e.kind === "expense")
      .reduce((s, e) => s + e.amount_cents, 0),
    houseMonth = data.payments
      .filter((p) => p.date.startsWith(month))
      .reduce((s, p) => s + p.amount_cents, 0);
  const categoryData = categories
    .map((name) => ({
      name,
      value: monthEntries
        .filter((e) => e.kind === "expense" && e.category === name)
        .reduce((s, e) => s + e.amount_cents / 100, 0),
    }))
    .filter((d) => d.value > 0);
  const report = Array.from({ length: 12 }, (_, i) => {
    const prefix = year + "-" + String(i + 1).padStart(2, "0");
    return {
      name: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
        new Date(Number(year), i, 1),
      ),
      receitas: data.entries
        .filter((e) => e.kind === "income" && e.date.startsWith(prefix))
        .reduce((s, e) => s + e.amount_cents / 100, 0),
      despesas: data.entries
        .filter((e) => e.kind === "expense" && e.date.startsWith(prefix))
        .reduce((s, e) => s + e.amount_cents / 100, 0),
      casa: data.payments
        .filter((e) => e.date.startsWith(prefix))
        .reduce((s, e) => s + e.amount_cents / 100, 0),
    };
  });
  const history = data.payments.filter(
    (p) =>
      (!period.from || p.date >= period.from) &&
      (!period.to || p.date <= period.to),
  );
  function transactionRows(entries: Entry[]) {
    return entries.length ? (
      <div className="transaction-list">
        {entries.map((e) => (
          <div className="transaction-row" key={e.id}>
            <span
              className={"entry-icon " + (e.kind === "income" ? "income" : "")}
            >
              {e.kind === "income" ? (
                <ArrowUpRight size={19} />
              ) : (
                <ArrowDownLeft size={19} />
              )}
            </span>
            <div className="entry-description">
              <strong>{e.description}</strong>
              <span>
                {e.category} · {e.username} · {dateLabel(e.date)}
              </span>
            </div>
            <strong className={e.kind === "income" ? "positive" : ""}>
              {e.kind === "income" ? "+" : "−"} {currency(e.amount_cents)}
            </strong>
            {canEdit(user, e.user_id) && (
              <div className="row-actions">
                <button
                  aria-label={"Editar " + e.description}
                  onClick={() => newDraft("entry", e)}
                  disabled={busy}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label={"Excluir " + e.description}
                  onClick={() => remove("entry", e.id)}
                  disabled={busy}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <Empty
        text="Nenhuma movimentação neste período."
        sub="Os lançamentos registrados aparecerão aqui."
      />
    );
  }
  function progress() {
    return (
      <>
        <div className="progress-label">
          <span>Seu caminho até a quitação</span>
          <strong>{debt.progress.toFixed(1).replace(".", ",")}%</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={debt.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da quitação"
        >
          <span style={{ width: debt.progress + "%" }} />
        </div>
        <div className="progress-caption">
          <span>{currency(debt.paid)} conquistados</span>
          <span>{currency(data.settings.total_cents)} no total</span>
        </div>
      </>
    );
  }
  const selected = links.find((l) => l.tab === tab)!;
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Wallet size={24} />
          </span>
          controle<span className="brand-blue">blue</span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">
            <Home size={19} />
          </span>
          <div>
            <strong>Nosso planejamento</strong>
            <small>Um futuro compartilhado</small>
          </div>
        </div>
        <div className="nav-caption">SEU ESPAÇO</div>
        <nav>
          {links
            .filter(
              (l) =>
                (l.tab !== "configuracoes" || admin) &&
                (user.role !== "viewer" || l.tab === "casa"),
            )
            .map((l) => (
              <Link
                key={l.tab}
                href={l.href}
                className={tab === l.tab ? "active" : ""}
              >
                <l.icon size={20} />
                {l.label}
                {tab === l.tab && <span className="nav-dot" />}
              </Link>
            ))}
        </nav>
        <div className="sidebar-goal">
          <span className="mini-home">
            <Home size={21} />
          </span>
          <strong>A casa é o nosso próximo passo.</strong>
          <p>Cada parcela, uma conquista.</p>
          <div className="progress-track">
            <span style={{ width: debt.progress + "%" }} />
          </div>
          <small>{debt.progress.toFixed(1)}% do sonho realizado</small>
        </div>
        <div className="sidebar-account">
          <span className="avatar">{user.name[0]}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{roleLabels[user.role]}</small>
          </div>
          <button onClick={logout} disabled={busy} aria-label="Sair da conta">
            <LogOut size={19} />
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Seu espaço <ChevronRight size={14} />
            <strong>{selected.label}</strong>
          </div>
          <div className="topbar-right">
            <span
              className={"sync-status " + (!connected ? "offline" : "")}
              title={
                "Última atualização: " +
                new Date(lastSync).toLocaleTimeString("pt-BR")
              }
            >
              <i />
              {connected ? "Atualizado" : "Sem conexão"}
            </span>
            <button
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.dataset.theme = next
                  ? "dark"
                  : "light";
                localStorage.setItem("blue-theme", next ? "dark" : "light");
              }}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="avatar small-avatar">{user.name[0]}</span>
            <button
              className="mobile-logout"
              onClick={logout}
              disabled={busy}
              aria-label="Sair"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {tab === "dashboard"
                  ? "SEU DINHEIRO, COM MAIS CLAREZA"
                  : tab === "casa"
                    ? "CADA PARCELA É UMA CONQUISTA"
                    : tab === "configuracoes"
                      ? "CUIDE DO SEU ESPAÇO"
                      : "TUDO NO SEU CONTROLE"}
              </span>
              <h1>
                {tab === "dashboard" ? (
                  <>
                    Olá, {user.name}
                    <span className="hello-dot">.</span>
                  </>
                ) : (
                  selected.label
                )}
              </h1>
              <p>
                {tab === "dashboard"
                  ? "Vamos construir um futuro mais tranquilo, juntos."
                  : tab === "casa"
                    ? "Acompanhe o caminho até a casa ser totalmente sua."
                    : tab === "gastos"
                      ? "Organize os detalhes. Enxergue o todo."
                      : tab === "relatorios"
                        ? "Seu ano em perspectiva, com números que fazem sentido."
                        : "Contas fixas, permissões e planejamento da casa."}
              </p>
            </div>
            <div className="heading-actions">
              {(tab === "dashboard" || tab === "gastos") && (
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  aria-label="Selecionar mês"
                />
              )}
              {editor && (tab === "dashboard" || tab === "gastos") && (
                <button className="primary" onClick={() => newDraft("entry")}>
                  <Plus size={18} />
                  Novo lançamento
                </button>
              )}
              {editor && tab === "casa" && debt.remaining > 0 && (
                <button className="primary" onClick={() => newDraft("payment")}>
                  <Plus size={18} />
                  Registrar pagamento
                </button>
              )}
            </div>
          </div>
          {!connected && (
            <div className="error-box" role="alert">
              Não foi possível atualizar os dados. Exibindo a última leitura;
              confira a conexão antes de lançar.
            </div>
          )}
          {debt.nearPayoff && (
            <div className="milestone">
              <Check size={20} />
              Está chegando! Faltam apenas {debt.remainingInstallments} parcelas
              para quitar a casa.
            </div>
          )}
          {(tab === "dashboard" || tab === "gastos") && (
            <div className="stats-grid">
              <Stat
                label="Receitas do mês"
                value={currency(income)}
                icon={<ArrowUpRight />}
                note="Entradas registradas"
                tone="green"
              />
              <Stat
                label="Despesas do mês"
                value={currency(expense)}
                icon={<ArrowDownLeft />}
                note="Gastos registrados"
              />
              <Stat
                label="Casa neste mês"
                value={currency(houseMonth)}
                icon={<Home />}
                note="Pagamentos da dívida"
              />
              <Stat
                label="Saldo do mês"
                value={currency(income - expense - houseMonth)}
                icon={<Wallet />}
                note="Receitas − gastos − casa"
                tone="blue"
              />
            </div>
          )}
          {tab === "dashboard" && (
            <>
              <div className="dashboard-grid">
                <section className="house-feature">
                  <div className="house-feature-top">
                    <span className="house-tag">
                      <Home size={16} /> NOSSA CASA
                    </span>
                    <span className="house-badge">Um sonho em construção</span>
                  </div>
                  <h2>O futuro tem endereço.</h2>
                  <p>Mais uma parcela, mais perto de chamar de nossa.</p>
                  <div className="house-balance">
                    <span>Saldo para quitar</span>
                    <strong>{currency(debt.remaining)}</strong>
                  </div>
                  {progress()}
                  <div className="house-bottom">
                    <span>
                      <CalendarDays size={16} />
                      {debt.payoff}
                    </span>
                    <Link href="/casa">
                      Ver detalhes <ArrowUpRight size={17} />
                    </Link>
                  </div>
                </section>
                <section className="panel category-panel">
                  <div className="panel-heading">
                    <h2>Para onde vai seu dinheiro</h2>
                    <span className="subtle">Neste mês</span>
                  </div>
                  {categoryData.length ? (
                    <>
                      <div className="donut">
                        <ResponsiveContainer width="100%" height={185}>
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="value"
                              innerRadius={62}
                              outerRadius={82}
                              paddingAngle={4}
                              stroke="none"
                            >
                              {categoryData.map((d, i) => (
                                <Cell
                                  key={d.name}
                                  fill={colors[i % colors.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v) => currency(Number(v) * 100)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center">
                          <span>Despesas</span>
                          <strong>{currency(expense)}</strong>
                        </div>
                      </div>
                      <div className="legend">
                        {categoryData.slice(0, 4).map((d, i) => (
                          <div key={d.name}>
                            <span>
                              <i style={{ background: colors[i] }} />
                              {d.name}
                            </span>
                            <strong>{currency(d.value * 100)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Empty
                      text="Um novo mês, uma nova página."
                      sub="Seu gráfico cresce com seus lançamentos."
                    />
                  )}
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Últimas movimentações</h2>
                    <p>Um retrato do seu mês.</p>
                  </div>
                  <Link className="text-link" href="/gastos">
                    Ver todas <ChevronRight size={16} />
                  </Link>
                </div>
                {transactionRows(monthEntries.slice(0, 5))}
              </section>
              <div className="reassurance">
                <ShieldCheck size={17} />
                Seu planejamento é compartilhado. Seu acesso é pessoal.
              </div>
            </>
          )}
          {tab === "gastos" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Movimentações do mês</h2>
                <span className="count">{filtered.length} lançamentos</span>
              </div>
              <div className="filters">
                <label>
                  Categoria
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Responsável
                  <select
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                  >
                    <option value="">Todos os usuários</option>
                    {data.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {transactionRows(filtered)}
            </section>
          )}
          {tab === "casa" && (
            <>
              <div className="stats-grid">
                <Stat
                  label="Valor total da casa"
                  value={currency(data.settings.total_cents)}
                  icon={<Home />}
                  note="Valor acordado"
                />
                <Stat
                  label="Total conquistado"
                  value={currency(debt.paid)}
                  icon={<Check />}
                  note={`${debt.paidInstallments} parcelas equivalentes pagas`}
                  tone="green"
                />
                <Stat
                  label="Saldo devedor"
                  value={currency(debt.remaining)}
                  icon={<Wallet />}
                  note={`${debt.remainingInstallments} parcelas restantes`}
                  tone="blue"
                />
                <Stat
                  label="Previsão de quitação"
                  value={debt.payoff}
                  icon={<CalendarDays />}
                  note="Com o ritmo mensal planejado"
                />
              </div>
              <HouseProgressCard
                settings={data.settings}
                payments={data.payments}
              />
              <section className="panel">
                <div className="panel-heading">
                  <h2>Histórico de pagamentos</h2>
                  <span className="count">{history.length} registros</span>
                </div>
                <div className="filters">
                  <label>
                    De
                    <input
                      type="date"
                      value={period.from}
                      onChange={(e) =>
                        setPeriod({ ...period, from: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Até
                    <input
                      type="date"
                      value={period.to}
                      onChange={(e) =>
                        setPeriod({ ...period, to: e.target.value })
                      }
                    />
                  </label>
                </div>
                {history.length ? (
                  <div className="transaction-list">
                    {history.map((p) => (
                      <div className="transaction-row" key={p.id}>
                        <span className="entry-icon income">
                          <Home size={18} />
                        </span>
                        <div className="entry-description">
                          <strong>{p.note || "Pagamento da casa"}</strong>
                          <span>
                            {dateLabel(p.date)} · {p.username}
                          </span>
                        </div>
                        <strong className="positive">
                          {currency(p.amount_cents)}
                        </strong>
                        {canEdit(user, p.user_id) && (
                          <div className="row-actions">
                            <button
                              disabled={busy}
                              onClick={() => newDraft("payment", p)}
                              aria-label="Editar pagamento"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => remove("payment", p.id)}
                              aria-label="Excluir pagamento"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    text="O próximo pagamento começa aqui."
                    sub="Os R$ 3.000 já pagos estão contabilizados no saldo inicial."
                  />
                )}
              </section>
            </>
          )}
          {tab === "relatorios" && (
            <>
              <div className="report-toolbar">
                <label>
                  Ano
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </label>
                {admin && (
                  <a className="primary" href="/api/blue?export=csv">
                    <Download size={18} />
                    Exportar todos os dados
                  </a>
                )}
              </div>
              <div className="stats-grid">
                <Stat
                  label="Receitas no ano"
                  value={currency(
                    report.reduce((s, r) => s + r.receitas * 100, 0),
                  )}
                  icon={<TrendingUp />}
                  note={year}
                  tone="green"
                />
                <Stat
                  label="Despesas no ano"
                  value={currency(
                    report.reduce((s, r) => s + r.despesas * 100, 0),
                  )}
                  icon={<ArrowDownLeft />}
                  note={year}
                />
                <Stat
                  label="Casa no ano"
                  value={currency(report.reduce((s, r) => s + r.casa * 100, 0))}
                  icon={<Home />}
                  note={year}
                />
                <Stat
                  label="Falta para conquistar"
                  value={currency(debt.remaining)}
                  icon={<Wallet />}
                  note="Saldo total atual"
                  tone="blue"
                />
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Seu ano, mês a mês</h2>
                  <span className="subtle">Valores em reais</span>
                </div>
                <div className="bar-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={report}
                      margin={{ left: 0, right: 15, top: 20, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => currency(Number(v) * 100)}
                        contentStyle={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          borderRadius: 12,
                        }}
                      />
                      <Bar
                        dataKey="receitas"
                        name="Receitas"
                        fill="#1ac1a4"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="despesas"
                        name="Despesas"
                        fill="#63a0ff"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="casa"
                        name="Casa"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-key">
                  <span>
                    <i style={{ background: "#1ac1a4" }} />
                    Receitas
                  </span>
                  <span>
                    <i style={{ background: "#63a0ff" }} />
                    Despesas
                  </span>
                  <span>
                    <i style={{ background: "#2563eb" }} />
                    Casa
                  </span>
                </div>
                <div className="annual-table">
                  <table>
                    <caption>Resumo mensal de {year}</caption>
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th>Receitas</th>
                        <th>Despesas</th>
                        <th>Casa</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((r) => (
                        <tr key={r.name}>
                          <td>{r.name}</td>
                          <td>{currency(r.receitas * 100)}</td>
                          <td>{currency(r.despesas * 100)}</td>
                          <td>{currency(r.casa * 100)}</td>
                          <td>
                            {currency((r.receitas - r.despesas - r.casa) * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {tab === "configuracoes" && admin && (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Pessoas e permissões</h2>
                    <p>Três contas fixas. Nenhum cadastro público.</p>
                  </div>
                  <ShieldCheck size={23} />
                </div>
                <div className="user-cards">
                  {data.users.map((u) => (
                    <div className="user-card" key={u.id}>
                      <span className="avatar">{u.name[0]}</span>
                      <div>
                        <h3>{u.name}</h3>
                        <small>
                          @{u.username} ·{" "}
                          {u.first_login
                            ? "Aguardando ativação"
                            : u.active
                              ? "Ativo"
                              : "Desativado"}
                        </small>
                      </div>
                      {u.username === "mark" ? (
                        <span className="count">Administrador</span>
                      ) : (
                        <select
                          aria-label={"Permissão de " + u.name}
                          value={u.role}
                          disabled={busy}
                          onChange={(e) =>
                            mutate(
                              "user",
                              {
                                username: u.username,
                                role: e.target.value as Role,
                              },
                              "Permissão atualizada; sessões revogadas.",
                            )
                          }
                        >
                          <option value="viewer">Somente leitura</option>
                          <option value="editor">Leitura e lançamento</option>
                        </select>
                      )}
                      {u.username !== "mark" && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            mutate(
                              "user",
                              { username: u.username, active: !u.active },
                              "Acesso atualizado; sessões revogadas.",
                            )
                          }
                        >
                          {u.active ? "Desativar" : "Reativar"}
                        </button>
                      )}
                      {u.first_login && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={async () => {
                            const r = await mutate(
                              "invite",
                              { username: u.username },
                              "Convite criado. Válido por 7 dias.",
                            );
                            if (r)
                              setInvite(
                                location.origin +
                                  "/login#user=" +
                                  r.username +
                                  "&activation=" +
                                  r.activation,
                              );
                          }}
                        >
                          Gerar convite
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {invite && (
                  <div className="invite-box">
                    <strong>Compartilhe somente com o titular da conta</strong>
                    <input
                      value={invite}
                      readOnly
                      aria-label="Link de ativação"
                    />
                    <button
                      className="secondary"
                      onClick={() =>
                        navigator.clipboard.writeText(invite).then(
                          () => notify("Convite copiado."),
                          () =>
                            notify(
                              "Selecione o link e copie manualmente.",
                              true,
                            ),
                        )
                      }
                    >
                      <Copy size={16} />
                      Copiar convite
                    </button>
                  </div>
                )}
                <p className="subtle">
                  Andressa pode editar/excluir seus próprios registros. Sidney
                  começa em leitura. Só Mark administra contas.
                </p>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Alterar senha</h2>
                    <p>A alteração encerra todas as sessões do usuário.</p>
                  </div>
                </div>
                <form
                  className="admin-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await mutate(
                      "reset_password",
                      { username: adminUser, password: adminPassword },
                      "Senha alterada; sessões encerradas.",
                    );
                    if (r) {
                      setAdminPassword("");
                      if (adminUser === "mark") location.assign("/login");
                    }
                  }}
                >
                  <label>
                    Usuário
                    <select
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                    >
                      {data.users
                        .filter((u) => !u.first_login)
                        .map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Nova senha
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={10}
                      required
                      placeholder="No mínimo 10 caracteres"
                    />
                  </label>
                  <button
                    className="primary"
                    disabled={
                      busy ||
                      !data.users.some(
                        (u) => u.username === adminUser && !u.first_login,
                      )
                    }
                  >
                    Salvar nova senha
                  </button>
                </form>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Planejamento da casa</h2>
                </div>
                <form
                  className="admin-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await mutate(
                        "settings",
                        {
                          total_cents: parseMoney(settings.total),
                          installment_cents: parseMoney(settings.installment),
                          due_day: Number(settings.due),
                        },
                        "Planejamento atualizado.",
                      );
                    } catch (e) {
                      notify(
                        e instanceof Error ? e.message : "Valor inválido.",
                        true,
                      );
                    }
                  }}
                >
                  <label>
                    Valor total (R$)
                    <input
                      inputMode="decimal"
                      value={settings.total}
                      onChange={(e) =>
                        setSettings({ ...settings, total: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Parcela mensal (R$)
                    <input
                      inputMode="decimal"
                      value={settings.installment}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          installment: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Dia do vencimento
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={settings.due}
                      onChange={(e) =>
                        setSettings({ ...settings, due: e.target.value })
                      }
                      required
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    Salvar planejamento
                  </button>
                </form>
              </section>
            </>
          )}
        </main>
        <footer className="main-footer">
          <span>Controle Blue</span>
          <span>Planejar. Compartilhar. Conquistar.</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {links
          .filter(
            (l) =>
              (l.tab !== "configuracoes" || admin) &&
              (user.role !== "viewer" || l.tab === "casa"),
          )
          .map((l) => (
            <Link
              key={l.tab}
              href={l.href}
              className={tab === l.tab ? "active" : ""}
            >
              <l.icon size={20} />
              <span>
                {l.tab === "dashboard"
                  ? "Resumo"
                  : l.tab === "gastos"
                    ? "Gastos"
                    : l.tab === "casa"
                      ? "Casa"
                      : l.tab === "configuracoes"
                        ? "Ajustes"
                        : "Relatórios"}
              </span>
            </Link>
          ))}
      </nav>
      {message && (
        <div
          className={"toast " + (message.error ? "toast-error" : "")}
          role={message.error ? "alert" : "status"}
        >
          {message.error ? <X size={19} /> : <Check size={19} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="entry-dialog"
        onCancel={() => setDraft(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDraft(null);
        }}
      >
        {draft && (
          <form onSubmit={save}>
            <div className="panel-heading">
              <div>
                <h2>
                  {draft.type === "payment"
                    ? "Um passo para a nossa casa"
                    : "Nova movimentação"}
                </h2>
                <p>
                  {draft.type === "payment"
                    ? "O saldo será recalculado ao salvar."
                    : "Os detalhes fazem a diferença."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setDraft(null)}
              >
                <X />
              </button>
            </div>
            <label>
              Valor (R$)
              <input
                autoFocus
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                placeholder="0,00"
                required
              />
            </label>
            <label>
              Data
              <input
                type="date"
                max={todayBR()}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                required
              />
            </label>
            <label>
              {draft.type === "payment" ? "Observação (opcional)" : "Descrição"}
              <input
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                maxLength={200}
                required={draft.type === "entry"}
                placeholder={
                  draft.type === "payment"
                    ? "Parcela, antecipação…"
                    : "O que você registrou?"
                }
              />
            </label>
            {draft.type === "entry" && (
              <div className="form-grid">
                <label>
                  Tipo
                  <select
                    value={draft.kind}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        kind: e.target.value as "expense" | "income",
                      })
                    }
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </label>
                <label>
                  Categoria
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <p className="subtle">
              Responsável: {user.name}. A identidade é validada no servidor.
            </p>
            <button className="primary full" disabled={busy}>
              {busy ? "Salvando…" : "Salvar lançamento"}
              <Check size={18} />
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}
function Stat({
  label,
  value,
  icon,
  note,
  tone = "",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  note: string;
  tone?: string;
}) {
  return (
    <section className={"stat " + tone}>
      <div>
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </section>
  );
}
function Empty({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="empty">
      <span>
        <Wallet size={25} />
      </span>
      <strong>{text}</strong>
      <p>{sub}</p>
    </div>
  );
}
