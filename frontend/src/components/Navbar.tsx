"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PawPrint, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
      <nav className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <PawPrint className="text-emerald-600" />
          <span className="font-semibold">NutriHuella</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="/dashboard">Dashboard</Link>
          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
              <button onClick={logout} className="px-3 py-2 rounded border hover:bg-gray-50">
                <LogOut className="mr-2 h-4 w-4 inline-block" />Salir
              </button>
            </>
          ) : (
            <Link className="px-3 py-2 rounded bg-emerald-600 text-white" href="/login">Iniciar sesión</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
