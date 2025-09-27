// src/app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import AvatarUploader from "@/components/profile/AvatarUploader";

// ===== Endpoints (ajústalos si tu backend usa otros) =====
const PROFILE_PATCH = "/api/users/me";             // PATCH { name }
const PASSWORD_POST = "/api/auth/change-password"; // POST { current, next }
const AVATAR_POST   = "/api/users/me/avatar";      // POST FormData "file"

// ===== Reglas de contraseña (mismas del registro) =====
const SPECIALS = `!@#$%^&*()-_=+[]{};:'",.<>/?\`~|\\`;
const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);
const countSpecials = (s: string) =>
  Array.from(s).reduce((n, ch) => (SPECIALS.includes(ch) ? n + 1 : n), 0);

function validatePassword(pw: string) {
  return {
    minLen: pw.length >= 8,
    specials: countSpecials(pw) >= 2,
    upper: hasUpper(pw),
    digit: hasDigit(pw),
  };
}

function strengthLabel(pw: string) {
  const v = validatePassword(pw);
  const okCount = [v.minLen, v.specials, v.upper, v.digit].filter(Boolean).length;
  if (okCount <= 1) return { cls: "strength strength-weak", text: "Fuerza: débil" };
  if (okCount === 2 || (okCount === 3 && pw.length < 12))
    return { cls: "strength strength-mid", text: "Fuerza: media" };
  return { cls: "strength strength-strong", text: "Fuerza: alta" };
}

export default function ProfilePage() {
  const { user, refresh, logout, loading } = useAuth();

  // Datos básicos
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Password change
  const [pwd, setPwd] = useState({ current: "", next: "", next2: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  // Estado general
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      await api.patch(PROFILE_PATCH, { name: name.trim() || null });
      await refresh();
      setStatus("✅ Perfil actualizado");
    } catch (err: any) {
      setStatus(err?.message || "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarUploaded() {
    await refresh();
    setStatus("🖼️ Avatar actualizado");
  }

  // ====== Password: validación dinámica ======
  const rules = useMemo(() => validatePassword(pwd.next), [pwd.next]);
  const strength = useMemo(() => strengthLabel(pwd.next), [pwd.next]);
  const nextMatches = pwd.next.length > 0 && pwd.next === pwd.next2;
  const passwordOk =
    rules.minLen && rules.specials && rules.upper && rules.digit && nextMatches;

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!passwordOk) {
      setStatus("La nueva contraseña aún no cumple los requisitos.");
      return;
    }
    setPwdSaving(true);
    try {
      await api.post(PASSWORD_POST, { current: pwd.current, next: pwd.next });
      setStatus("🔐 Contraseña actualizada");
      setPwd({ current: "", next: "", next2: "" });
    } catch (err: any) {
      setStatus(err?.message || "No se pudo cambiar la contraseña");
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <h1 className="text-3xl font-semibold text-ink">Mi perfil</h1>
      </header>

      {/* Card: Datos básicos */}
      <section className="card">
        <h2 className="text-xl font-semibold text-ink mb-4">Datos básicos</h2>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="h-24 w-24 rounded-full overflow-hidden border border-[--nh-border] bg-[#F8F8F8]">
              <Image
                src={user?.picture || "/nutrihuella/avatar-placeholder.png"}
                alt="Avatar"
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
              />
            </div>
            <div className="mt-3">
              <AvatarUploader endpoint={AVATAR_POST} onUploaded={onAvatarUploaded} />
            </div>
          </div>

          {/* Form nombre/email */}
          <form onSubmit={saveProfile} className="flex-1 space-y-4">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input className="input" value={user?.email || ""} disabled />
              <p className="help">El email no se puede editar desde aquí.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary disabled:opacity-50" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => refresh()}>
                Recargar
              </button>
              <button type="button" className="btn btn-outline" onClick={logout}>
                Cerrar sesión
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Card: Cambiar contraseña (con checklist dinámico) */}
      <section className="card">
        <h2 className="text-xl font-semibold text-ink mb-4">Cambiar contraseña</h2>

        <form onSubmit={changePassword} className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="pwd-current">Contraseña actual</label>
              <input
                id="pwd-current"
                type="password"
                className="input"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              />
            </div>

            <div className="relative">
              <label className="label" htmlFor="pwd-next">Nueva contraseña</label>
              <input
                id="pwd-next"
                type="password"
                className="input pr-10"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                placeholder="Mín. 8; 2 especiales; 1 mayúscula; 1 número"
                aria-invalid={!passwordOk && pwd.next.length > 0}
              />
            </div>

            {/* Barra de fuerza */}
            <div>
              <div className={strength.cls}><span /></div>
              <p className="help mt-1">{strength.text}</p>
            </div>
          </div>

          {/* Checklist + confirmar */}
          <div className="space-y-4">
            {/* Checklist dinámico (igual que en /register) */}
            <ul className="mt-1 space-y-1">
              <li className="flex items-center gap-2">
                <span className={rules.minLen ? "text-green-600" : "text-[var(--nh-danger)]"}>
                  {rules.minLen ? "✅" : "❌"}
                </span>
                <span className="text-sm">≥ 8 caracteres</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={rules.specials ? "text-green-600" : "text-[var(--nh-danger)]"}>
                  {rules.specials ? "✅" : "❌"}
                </span>
                <span className="text-sm">≥ 2 caracteres especiales</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={rules.upper ? "text-green-600" : "text-[var(--nh-danger)]"}>
                  {rules.upper ? "✅" : "❌"}
                </span>
                <span className="text-sm">≥ 1 mayúscula</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={rules.digit ? "text-green-600" : "text-[var(--nh-danger)]"}>
                  {rules.digit ? "✅" : "❌"}
                </span>
                <span className="text-sm">≥ 1 número</span>
              </li>
            </ul>

            {/* Confirmar nueva */}
            <div>
              <label className="label" htmlFor="pwd-next2">Repite la nueva</label>
              <input
                id="pwd-next2"
                type="password"
                className="input"
                value={pwd.next2}
                onChange={(e) => setPwd({ ...pwd, next2: e.target.value })}
                aria-invalid={pwd.next.length > 0 && !nextMatches}
              />
              {pwd.next.length > 0 && (
                <p className={`help ${nextMatches ? "text-green-600" : "text-[var(--nh-danger)]"}`}>
                  {nextMatches ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                className="btn btn-primary w-full disabled:opacity-50"
                disabled={!passwordOk || pwdSaving}
              >
                {pwdSaving ? "Actualizando…" : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Estado/alertas */}
      {status && (
        <div className="rounded-xl border border-[--nh-border] bg-white p-4">
          <p className="text-sm">{status}</p>
        </div>
      )}
    </div>
  );
}
