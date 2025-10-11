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
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: 'omit',
    });

    const text = await res.text().catch(() => '');
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      const msg = json?.message || json?.error || text || `${res.status} ${res.statusText || 'Error'}`;
      console.error('API error', {
        url, method: opts.method || 'GET',
        status: res.status, statusText: res.statusText,
        message: msg, responseText: text, responseJson: json,
      });
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
      console.error('Network/CORS error calling API', { url, opts });
      throw new Error('No se pudo conectar con el backend. Verifica que el servidor en :4000 esté encendido y que CORS permita Authorization.');
    }
    throw e;
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
