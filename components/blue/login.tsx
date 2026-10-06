"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Home,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";
export function Login({
  configured,
  setup = false,
  initialUser = "mark",
}: {
  configured: boolean;
  setup?: boolean;
  initialUser?: string;
}) {
  const [username, setUsername] = useState(initialUser),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [activation, setActivation] = useState(""),
    [first, setFirst] = useState(setup),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const token = hash.get("activation");
    if (token && !setup) {
      location.replace("/auth/setup-password" + location.hash);
      return;
    }
    if (token) {
      setActivation(token);
      setFirst(true);
      const user = hash.get("user");
      if (user) setUsername(user);
      history.replaceState(null, "", setup ? "/auth/setup-password" : "/login");
    }
  }, [setup]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (first && password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/blue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: first
            ? activation
              ? "activate"
              : "setup_password"
            : "login",
          payload: { username, password, activation },
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error);
      location.assign(result.needsSetup ? "/auth/setup-password" : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao entrar.");
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <a className="brand" href="/login">
          <span className="brand-icon">
            <Wallet size={24} />
          </span>
          controle<span className="brand-blue">blue</span>
        </a>
        <div className="story-copy">
          <span className="eyebrow">MENOS PREOCUPAÇÃO. MAIS FUTURO.</span>
          <h1>
            Um plano.
            <br />
            Uma casa.
            <br />
            <span>Uma vida a dois.</span>
          </h1>
          <p>
            Seu dinheiro organizado, suas conquistas cada vez mais perto. Tudo
            em um lugar, com quem importa.
          </p>
          <div className="story-house">
            <Home size={30} />
            <div>
              <strong>O próximo capítulo é de vocês.</strong>
              <span>Transforme cada pagamento em uma conquista.</span>
            </div>
          </div>
        </div>
        <span className="story-footer">
          CONTROLE BLUE · FINANÇAS COM PROPÓSITO
        </span>
      </section>
      <section className="login-side">
        <div className="login-card">
          <div className="security-pill">
            <ShieldCheck size={16} /> Ambiente privado e seguro
          </div>
          <h2>{first ? "Seu primeiro passo." : "Bom ter você aqui."}</h2>
          <p>
            {first
              ? "Crie sua senha pessoal para ativar sua conta."
              : "Entre para acompanhar suas finanças e conquistas."}
          </p>
          <form onSubmit={submit}>
            <label>
              Usuário
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
              >
                <option value="mark">Mark</option>
                <option value="andressa">Andressa</option>
                <option value="sidney">Sidney</option>
              </select>
            </label>
            {first && (!setup || activation) && (
              <label>
                Código de ativação
                <input
                  value={activation}
                  onChange={(e) => setActivation(e.target.value)}
                  autoComplete="off"
                  required
                  placeholder="Convite individual enviado pelo Mark"
                />
              </label>
            )}
            <label>
              {first ? "Crie sua senha" : "Senha"}
              <div className="password-field">
                <input
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={first ? "new-password" : "current-password"}
                  minLength={first ? 10 : undefined}
                  required
                  placeholder={
                    first ? "No mínimo 10 caracteres" : "Sua senha pessoal"
                  }
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>
            {first && (
              <label>
                Confirme a senha
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="new-password"
                  minLength={10}
                  required
                />
              </label>
            )}
            {error && (
              <div role="alert" className="error-box">
                {error}
              </div>
            )}
            {!configured && (
              <div className="error-box">
                O banco está sendo configurado. O acesso será liberado após a
                publicação.
              </div>
            )}
            <button className="primary full" disabled={busy || !configured}>
              {busy
                ? "Aguarde…"
                : first
                  ? "Criar senha e entrar"
                  : "Entrar no Controle Blue"}
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => {
              if (setup) {
                location.assign("/login");
                return;
              }
              setFirst(!first);
              setError("");
            }}
          >
            {first ? "Já tenho uma senha" : "Primeiro acesso? Ative sua conta"}
          </button>
          <p className="login-note">
            Acesso exclusivo para Mark, Andressa e Sidney.
            <br />
            Após a ativação, alterações de senha são feitas pelo Mark.
          </p>
        </div>
        <small>Organizar hoje. Conquistar amanhã.</small>
      </section>
    </main>
  );
}
