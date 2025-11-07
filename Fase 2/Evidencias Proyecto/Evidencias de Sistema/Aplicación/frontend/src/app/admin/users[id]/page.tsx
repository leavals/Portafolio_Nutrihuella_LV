// src/app/admin/users/[id]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/lib/auth-context';
import { AdminAPI, type AdminUser } from '@/lib/admin';

export default function AdminUserPage() {
  const { isAdmin, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = String(params?.id || '');
  const allowed = useMemo(() => isAdmin, [isAdmin]);

  const [u, setU] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [role, setRole] = useState<string>('USER');
  const [plan, setPlan] = useState<'BASIC' | 'PLUS'>('BASIC');

  useEffect(() => {
    if (!allowed || loading || !id) return;
    (async () => {
      setBusy(true);
      setErr(null);
      try {
        const user = await AdminAPI.getUser(id);
        setU(user);
        setRole(String(user.role || 'USER').toUpperCase());
        setPlan((user.plan || 'BASIC') as 'BASIC' | 'PLUS');
      } catch (e: any) {
        setErr(e?.message || 'No se pudo cargar el usuario');
      } finally {
        setBusy(false);
      }
    })();
  }, [allowed, loading, id]);

  async function saveBasics() {
    if (!u) return;
    setBusy(true);
    setErr(null);
    try {
      await AdminAPI.updateUser(u.id, { role, plan });
      const fresh = await AdminAPI.getUser(u.id);
      setU(fresh);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail() {
    if (!u) return;
    setBusy(true);
    setErr(null);
    try {
      await AdminAPI.verifyUserEmail(u.id);
      const fresh = await AdminAPI.getUser(u.id);
      setU(fresh);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo verificar el email');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <RoleGate requireAdmin>
      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Usuario</h1>
            <p className="text-sm text-slate-600">Administración del perfil y atributos.</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-slate-50"
          >
            Volver
          </button>
        </header>

        <div className="rounded-xl border bg-white p-4">
          {busy && !u ? (
            <p className="text-slate-500">Cargando…</p>
          ) : err ? (
            <p className="text-red-600">{err}</p>
          ) : !u ? (
            <p className="text-slate-500">No encontrado</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <div className="text-sm text-slate-500">Nombre</div>
                  <div className="text-base font-medium">{u.name || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="text-base">{u.email}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Rol</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="input"
                    >
                      <option value="USER">USER</option>
                      <option value="ANALYST">ANALYST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Plan</label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as 'BASIC' | 'PLUS')}
                      className="input"
                    >
                      <option value="BASIC">BASIC</option>
                      <option value="PLUS">PLUS</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={saveBasics}
                      disabled={busy}
                      className="btn btn-primary w-full"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm">Email verificado:</span>
                  {u.emailVerifiedAt ? (
                    <span className="inline-block text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs">
                      Sí
                    </span>
                  ) : (
                    <>
                      <span className="inline-block text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-xs">
                        No
                      </span>
                      <button
                        onClick={verifyEmail}
                        disabled={busy}
                        className="btn btn-outline-primary"
                      >
                        Verificar manualmente
                      </button>
                    </>
                  )}
                </div>
              </div>

              <aside className="space-y-2">
                <div className="text-sm text-slate-500">Creado</div>
                <div className="text-base">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                </div>
                <div className="text-sm text-slate-500 mt-4">Ubicación</div>
                <div className="text-base">
                  {u.commune || '—'} {u.city ? `, ${u.city}` : ''} {u.region ? `(${u.region})` : ''}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </RoleGate>
  );
}
