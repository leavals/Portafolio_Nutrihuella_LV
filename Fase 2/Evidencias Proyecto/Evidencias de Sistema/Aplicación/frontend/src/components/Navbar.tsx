// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Menu, Search, LogOut, User2, PawPrint, Heart, Utensils, Home, ChefHat, Crown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import usePlusUpgrade from '@/hooks/usePlusUpgrade';

type NavItem = { href: string; label: string; Icon: React.ComponentType<any> };

const authNav: NavItem[] = [
  { href: '/', label: 'Inicio', Icon: Home },
  { href: '/pets', label: 'Mis mascotas', Icon: PawPrint },
  { href: '/pantry', label: 'Mi despensa', Icon: Utensils },
  { href: '/recipes/favorites', label: 'Recetas favoritas', Icon: Heart },
  { href: '/recipes/generator', label: 'Generador de Recetas', Icon: ChefHat },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, plan, isPlus, loading, displayName, logout, isAuthenticated, cancelPlus } = useAuth();
  const { startUpgrade } = usePlusUpgrade();

  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur border-b border-white/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/nutrihuella/logo-mark.png"
            alt="NutriHuella"
            width={72}
            height={72}
            priority
            className="rounded-full"
          />
          <span className="text-2xl font-semibold tracking-tight">NutriHuella</span>
        </Link>

        {/* Buscador */}
        <div className="ml-auto hidden md:flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 shadow-sm w-[520px]">
          <Search className="h-4 w-4" />
          <input
            placeholder="Buscar"
            className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>

        {/* Estado de cuenta + CTA (desktop, solo autenticado) */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-2 ml-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                isPlus
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-slate-300 text-slate-700 bg-white'
              }`}
              title="Estado de la cuenta"
            >
              Cuenta: {isPlus ? 'Plus' : 'Básica'}
            </span>

            {!isPlus ? (
              <button
                className="inline-flex items-center gap-2 rounded-xl border bg-white/90 hover:bg-white px-3 py-2 shadow-sm"
                onClick={() => startUpgrade()}
                title="Actualizar a Plus"
              >
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Actualizar a Plus</span>
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm bg-white/90 hover:bg-white text-red-700 border-red-300"
                onClick={async () => {
                  const ok = window.confirm(
                    '¿Seguro que deseas cancelar tu membresía Plus? Perderás los beneficios de Plus y volverás a la cuenta Básica.'
                  );
                  if (!ok) return;
                  await cancelPlus();
                }}
                title="Cancelar membresía Plus"
              >
                <span className="text-sm">Cancelar membresía Plus</span>
              </button>
            )}
          </div>
        )}

        {/* Auth (desktop) */}
        <div className="ml-2 hidden md:flex items-center gap-2">
          {loading ? null : isAuthenticated ? (
            <div className="relative" ref={popRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border bg-white/80 hover:bg-white px-2 py-1.5 shadow-sm"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <Image
                  src={user?.picture ?? '/nutrihuella/avatar-placeholder.png'}
                  alt={displayName || 'Usuario'}
                  width={28}
                  height={28}
                  className="rounded-full h-auto w-auto"
                />
                <span className="text-sm">{displayName || 'Mi cuenta'}</span>
                <Menu className="h-4 w-4" />
              </button>

              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white/90 backdrop-blur shadow-xl ring-1 ring-black/5 p-1"
                >
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => setOpen(false)}
                  >
                    <User2 className="h-4 w-4" />
                    Panel
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => setOpen(false)}
                  >
                    <User2 className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline-primary">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn btn-primary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        {/* Menú (mobile) */}
        <button
          className="md:hidden ml-auto rounded-xl border bg-white/80 px-3 py-2 shadow-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Submenú centrado — solo autenticado */}
      {isAuthenticated && (
        <nav className="border-t border-white/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ul className="flex justify-center items-center gap-8 text-sm py-2 overflow-x-auto">
              {authNav.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'text-[--nh-primary] font-medium inline-flex items-center gap-2'
                          : 'hover:text-[--nh-primary] inline-flex items-center gap-2'
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
