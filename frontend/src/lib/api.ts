// Wrapper fetch con alias del()
export const api = {
  async request<T>(method: string, url: string, body?: any): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
    const raw = await res.text();
    const data = safeJson(raw);
    if (!res.ok) {
      console.error("API error", { method, url, status: res.status, data });
      const msg = (data && ((data as any).message || (data as any).error)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  },
  get<T>(url: string) { return this.request<T>("GET", url); },
  post<T>(url: string, body?: any) { return this.request<T>("POST", url, body); },
  put<T>(url: string, body?: any) { return this.request<T>("PUT", url, body); },
  patch<T>(url: string, body?: any) { return this.request<T>("PATCH", url, body); },
  delete<T>(url: string) { return this.request<T>("DELETE", url); },
  del<T>(url: string) { return this.delete<T>(url); }, // alias compat
};

function safeJson(s: string) { try { return JSON.parse(s); } catch { return s; } }
