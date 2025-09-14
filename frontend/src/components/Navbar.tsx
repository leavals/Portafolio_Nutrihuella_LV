"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 backdrop-blur ${scrolled ? "shadow bg-white/70" : "bg-white/60"}`}>
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--nh-green)] text-white font-bold">N</span>
          <span className="text-xl font-bold text-[var(--nh-green)]">NutriHuella</span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavItem href="/" label="Inicio" active={pathname === "/"} />
          {user && <NavItem href="/dashboard" label="Mascotas" active={pathname.startsWith("/dashboard") || pathname.startsWith("/pets")} />}
          {!user ? (
            <>
              <NavItem href="/login" label="Iniciar sesión" active={pathname.startsWith("/login")} />
              <NavItem href="/register" label="Crear cuenta" active={pathname.startsWith("/register")} />
            </>
          ) : (
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
      ${active ? "bg-[var(--nh-green)] text-white" : "text-slate-700 hover:bg-slate-100"}`}
    >
      {label}
    </Link>
  );
}
