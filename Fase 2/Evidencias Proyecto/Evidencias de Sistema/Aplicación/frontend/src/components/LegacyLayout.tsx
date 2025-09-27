"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PawPrint, Home, ShoppingBasket, Menu, X } from "lucide-react";

function NavItem({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-[#FFF8E7] text-[#388E3C] ring-1 ring-[#4CAF50]"
          : "text-[#212121]/80 hover:bg-white hover:text-[#212121]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <PawPrint className="h-6 w-6 text-[#4CAF50]" aria-hidden />
          <Link href="/" className="text-base font-semibold tracking-tight text-[#212121]">
            NutriHuella
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden gap-1 md:flex">
          <NavItem href="/" exact>
            <span className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" /> Inicio
            </span>
          </NavItem>
          <NavItem href="/pets">
            <span className="inline-flex items-center gap-2">
              <PawPrint className="h-4 w-4" /> Mascotas
            </span>
          </NavItem>

          {/* NUEVO: Mi despensa */}
          {isAuthenticated && (
            <NavItem href="/pantry">
              <span className="inline-flex items-center gap-2">
                <ShoppingBasket className="h-4 w-4" /> Mi despensa
              </span>
            </NavItem>
          )}
        </nav>

        {/* Right side: auth */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-[#212121]/70 max-w-[180px] truncate" title={user?.email}>
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="rounded-lg bg-[#FF9800] px-3 py-2 text-sm font-medium text-white hover:brightness-95"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#212121] hover:bg-white"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#4CAF50] px-3 py-2 text-sm font-medium text-white hover:brightness-95"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        {/* Mobile button */}
        <button
          className="inline-flex items-center justify-center rounded-lg border p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-black/5 bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2">
            <NavItem href="/" exact>
              <span className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" /> Inicio
              </span>
            </NavItem>
            <NavItem href="/pets">
              <span className="inline-flex items-center gap-2">
                <PawPrint className="h-4 w-4" /> Mascotas
              </span>
            </NavItem>
            {isAuthenticated && (
              <NavItem href="/pantry">
                <span className="inline-flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4" /> Mi despensa
                </span>
              </NavItem>
            )}

            <div className="mt-2 border-t border-black/5 pt-2">
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="w-full rounded-lg bg-[#FF9800] px-3 py-2 text-sm font-medium text-white hover:brightness-95"
                >
                  Cerrar sesión
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-[#212121] hover:bg-white"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="w-full rounded-lg bg-[#4CAF50] px-3 py-2 text-center text-sm font-medium text-white hover:brightness-95"
                  >
                    Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
