"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PawPrint, Home, ShoppingBasket, Menu, X } from "lucide-react";

function NavItem({ href, children, exact=false }:{
  href:string; children:React.ReactNode; exact?:boolean;
}){
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-[var(--cream)] text-[var(--brand-2)] ring-1 ring-[var(--brand)]"
          : "text-[var(--text)]/80 hover:bg-white hover:text-[var(--text)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function Navbar(){
  const { isAuthenticated, isClient, isAdmin, role, displayName, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Mostrar "Mi despensa" sólo con sesión y rol usuario (no admin)
  const canSeePantry = isAuthenticated && (!isAdmin) && (isClient || !role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="container flex items-center justify-between py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <PawPrint className="h-6 w-6 text-[var(--brand)]" aria-hidden />
          <Link href="/" className="text-base font-semibold tracking-tight">
            NutriHuella
          </Link>
        </div>

        {/* Desktop */}
        <nav className="hidden gap-1 md:flex">
          <NavItem href="/" exact>
            <span className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" /> Inicio
            </span>
          </NavItem>

          {/* ⬇️ Ahora “Mascotas” sólo con sesión */}
          {isAuthenticated && (
            <NavItem href="/pets">
              <span className="inline-flex items-center gap-2">
                <PawPrint className="h-4 w-4" /> Mascotas
              </span>
            </NavItem>
          )}

          {canSeePantry && (
            <NavItem href="/pantry">
              <span className="inline-flex items-center gap-2">
                <ShoppingBasket className="h-4 w-4" /> Mi despensa
              </span>
            </NavItem>
          )}
        </nav>

        {/* Right zone */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-[var(--text)]/70 max-w-[220px] truncate" title={displayName}>
                {displayName}
              </span>
              <button onClick={logout} className="btn btn-primary bg-[var(--accent)]">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Iniciar sesión</Link>
              <Link href="/register" className="btn btn-primary">Crear cuenta</Link>
            </>
          )}
        </div>

        {/* Mobile trigger */}
        <button
          className="inline-flex items-center justify-center rounded-lg border p-2 md:hidden"
          onClick={()=>setOpen(v=>!v)}
          aria-label="Abrir menú"
        >
          {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-black/5 bg-white md:hidden">
          <nav className="container flex flex-col gap-1 py-2">
            <NavItem href="/" exact>
              <span className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" /> Inicio
              </span>
            </NavItem>

            {isAuthenticated && (
              <NavItem href="/pets">
                <span className="inline-flex items-center gap-2">
                  <PawPrint className="h-4 w-4" /> Mascotas
                </span>
              </NavItem>
            )}

            {canSeePantry && (
              <NavItem href="/pantry">
                <span className="inline-flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4" /> Mi despensa
                </span>
              </NavItem>
            )}

            <div className="mt-2 border-t border-black/5 pt-2">
              {isAuthenticated ? (
                <button onClick={logout} className="w-full btn bg-[var(--accent)] text-white">
                  Cerrar sesión
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="w-full btn btn-ghost">Iniciar sesión</Link>
                  <Link href="/register" className="w-full btn btn-primary">Crear cuenta</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
