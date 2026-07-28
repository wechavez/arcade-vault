"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const close = () => setOpen(false);

  const isActive = (name: "inicio" | "biblioteca" | "salon" | "auth") => {
    if (name === "inicio") return pathname === "/inicio";
    if (name === "biblioteca") return pathname === "/" || pathname.startsWith("/juegos");
    if (name === "salon") return pathname === "/salon";
    return pathname === "/auth";
  };

  return (
    <>
      <nav className="av-nav">
        <Link href="/inicio" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/inicio" className={isActive("inicio") ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/" className={isActive("biblioteca") ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isActive("salon") ? "active" : ""}>
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer" />
        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
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
        <Link href="/inicio" onClick={close} className={isActive("inicio") ? "active" : ""}>
          Inicio
        </Link>
        <Link href="/" onClick={close} className={isActive("biblioteca") ? "active" : ""}>
          Biblioteca
        </Link>
        <Link href="/salon" onClick={close} className={isActive("salon") ? "active" : ""}>
          Salón de la Fama
        </Link>
        <Link href="/auth" onClick={close} className={isActive("auth") ? "active" : ""}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
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
