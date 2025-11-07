// src/lib/api-with-signal.ts
'use client';

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

type Opts = RequestInit & { body?: any };

async function requestWithSignal<T = any>(path: string, opts: Opts = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: 'omit',
      signal: opts.signal, // ⬅️ soporte AbortController
    });

    const text = await res.text().catch(() => '');
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      const msg = json?.message || json?.error || text || `${res.status} ${res.statusText || 'Error'}`;
      const err = new Error(msg) as any;
      err.status = res.status;
      err.responseText = text;
      err.responseJson = json;
      throw err;
    }

    if (!text) return null as any;
    const ct = res.headers.get('content-type') || '';
    return (ct.includes('application/json') ? json : (text as any)) as T;
  } catch (e: any) {
    const isNetwork = e?.name === 'TypeError' || /Failed to fetch/i.test(String(e?.message));
    if (isNetwork) {
      throw new Error('No se pudo conectar con el backend. Verifica que el servidor esté encendido y CORS permita Authorization.');
    }
    throw e;
  }
}

export const apiWithSignal = {
  post:  <T = any>(p: string, b?: any, opts?: { signal?: AbortSignal }) =>
    requestWithSignal<T>(p, { method: 'POST', body: b, signal: opts?.signal }),
  get:   <T = any>(p: string, opts?: { signal?: AbortSignal }) =>
    requestWithSignal<T>(p, { method: 'GET',  signal: opts?.signal }),
};
