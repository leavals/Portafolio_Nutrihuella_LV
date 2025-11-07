// src/lib/api.ts
'use client';

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

type Opts = RequestInit & { body?: any };

async function request<T = any>(path: string, opts: Opts = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    // Lee como texto primero para evitar fallas con body vacío
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    const data = ct.includes('application/json') && text ? JSON.parse(text) : (text || null);

    if (!res.ok) {
      const msg =
        (data && (data.message || data.error)) ||
        res.statusText ||
        'Error en la solicitud';
      throw new Error(msg);
    }

    // 204/201 sin body → null
    return (text ? (data as T) : (null as T));
  } catch (e: any) {
    // Re-lanza con mensaje claro
    throw new Error(e?.message || 'Error de red');
  }
}

const api = {
  get:   <T = any>(p: string)          => request<T>(p),
  post:  <T = any>(p: string, b?: any) => request<T>(p, { method: 'POST', body: b }),
  put:   <T = any>(p: string, b?: any) => request<T>(p, { method: 'PUT',  body: b }),
  patch: <T = any>(p: string, b?: any) => request<T>(p, { method: 'PATCH',body: b }),
  delete:<T = any>(p: string)          => request<T>(p, { method: 'DELETE' }),
};

export default api;
export { api };
