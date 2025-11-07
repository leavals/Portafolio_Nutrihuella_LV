// src/app/admin/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/lib/auth-context';
import { AdminAPI, type AdminUser } from '@/lib/admin';
import { Shield, Search } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { isAdmin, role, loading } = useAuth();

  const [rows, setRows] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAllowed = useMemo(() => isAdmin, [isAdmin]);

  useEffect(() => {
    if (!isAllowed || loading) return;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const resp = await AdminAPI.listUsers({
          q: submittedQ,
          page,
          pageSize,
        });
        setRows(resp?.items ?? []);
        setTotal(resp?.total ?? 0);
      } catch (e: any) {
        setError(e?.message || 'Error cargando usuarios');
      } finally {
        setBusy(false);
      }
    })();
  }, [isAllowed, loading, submittedQ, page, pageSize]);

  if (loading) return null;

  if (!isAllowed) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border bg-white/80 p-6">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Acceso restringido</h1>
          <p className="text-slate-700">
            Esta sección es solo para administradores. Si crees que es un error, contacta al equipo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[--nh-primary]" />
          Administración
        </h1>
        <span className="text-xs rounded-full border px-2 py-1 bg-white/70">
          Rol actual: {String(role || 'ADMIN')}
        </span>
      </header>

      {/* Filtro de búsqueda */}
      <div className="rounded-xl border bg-white/80 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSubmittedQ(q.trim());
          }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 border rounded-lg bg-white/80 px-2 py-1 w-full md:w-96">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border bg-[--nh-primary] text-white px-3 py-1.5 text-sm hover:opacity-95"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border bg-white/80">
        <table className="min-w-full text-sm">
          <thead className="bg-white/60">
            <tr className="[&>th]:text-left [&>th]:px-3 [&>th]:py-2 text-slate-700">
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Plan</th>
              <th>Verificado</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2">
            {busy ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-8">
                  Cargando…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center text-red-600 py-8">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-8">
                  Sin resultados
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t hover:bg-white">
                  <td className="font-medium">{u.name || '—'}</td>
                  <td className="text-slate-700">{u.email}</td>
                  <td>{(u.role || 'USER').toUpperCase()}</td>
                  <td>
                    <span
                      className={
                        (u.plan || 'BASIC') === 'PLUS'
                          ? 'inline-block text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs'
                          : 'inline-block text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-xs'
                      }
                    >
                      {u.plan || 'BASIC'}
                    </span>
                  </td>
                  <td>
                    {u.emailVerifiedAt ? (
                      <span className="inline-block text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs">
                        Sí
                      </span>
                    ) : (
                      <span className="inline-block text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-xs">
                        No
                      </span>
                    )}
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-[--nh-primary] hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pt-2">
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </section>
  );
}
