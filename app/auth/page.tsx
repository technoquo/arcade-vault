"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTab = (next: "in" | "up") => {
    setTab(next);
    setError(null);
    setSuccess(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (tab === "up" && pass !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    if (tab === "in") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (err) {
        setError(err.message);
      } else {
        router.push("/juegos");
      }
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password: pass });
      if (err) {
        setError(err.message);
      } else {
        setSuccess("Revisa tu correo para confirmar tu cuenta.");
      }
    }

    setLoading(false);
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button className={tab === "in" ? "on" : ""} onClick={() => handleTab("in")}>
            INICIAR SESIÓN
          </button>
          <button className={tab === "up" ? "on" : ""} onClick={() => handleTab("up")}>
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={tab === "in" ? "current-password" : "new-password"}
            />
          </div>

          {tab === "up" && (
            <div className="field slide-in">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                color: "var(--magenta)",
                letterSpacing: "0.06em",
              }}
            >
              ▲ {error}
            </p>
          )}

          {success && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                color: "var(--green)",
                textShadow: "0 0 8px rgba(0,255,136,0.5)",
                letterSpacing: "0.06em",
              }}
            >
              ✓ {success}
            </p>
          )}

          <button
            className="btn lg"
            type="submit"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : tab === "in" ? (
              "ENTRAR AL VAULT"
            ) : (
              "CREAR Y JUGAR"
            )}
          </button>
        </form>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button" onClick={() => signInWithOAuth("google")}>
            ◆&nbsp; GOOGLE
          </button>
          <button className="btn ghost" type="button" onClick={() => signInWithOAuth("github")}>
            ▣&nbsp; GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
