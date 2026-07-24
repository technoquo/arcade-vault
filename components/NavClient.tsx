"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";

interface Props {
  userEmail: string | null;
}

export default function NavClient({ userEmail }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isInicio = pathname === "/";
  const isBiblioteca = pathname === "/juegos" || pathname.startsWith("/juego/");
  const isSalon = pathname === "/salon";
  const isAbout = pathname === "/about";
  const isAuth = pathname === "/auth";

  const close = () => setOpen(false);
  const initial = userEmail ? userEmail[0].toUpperCase() : null;

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          <Link href="/" className={isInicio ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/juegos" className={isBiblioteca ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isSalon ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isAbout ? "active" : ""}>
            Acerca de
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {userEmail ? (
          <div className="auth-btn" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0,245,255,0.15)",
                border: "1px solid var(--cyan)",
                boxShadow: "0 0 8px rgba(0,245,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--pixel)",
                fontSize: 13,
                color: "var(--cyan)",
              }}
            >
              {initial}
            </div>
            <form action={signOut}>
              <button
                className="btn ghost"
                type="submit"
                style={{ padding: "8px 14px", fontSize: 9 }}
              >
                CERRAR SESIÓN
              </button>
            </form>
          </div>
        ) : (
          <Link href="/auth" className={`btn auth-btn${isAuth ? " on" : ""}`}>
            Acceder
          </Link>
        )}

        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close} />
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={isInicio ? "active" : ""} onClick={close}>
          Inicio
        </Link>
        <Link href="/juegos" className={isBiblioteca ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={isSalon ? "active" : ""} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/about" className={isAbout ? "active" : ""} onClick={close}>
          Acerca de
        </Link>
        {userEmail ? (
          <form
            action={signOut}
            style={{ padding: "14px 12px", borderBottom: "1px dashed var(--line-2)" }}
          >
            <button className="btn ghost" type="submit" style={{ width: "100%", fontSize: 9 }}>
              CERRAR SESIÓN
            </button>
          </form>
        ) : (
          <Link href="/auth" className={isAuth ? "active" : ""} onClick={close}>
            Acceder
          </Link>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
