import api from './api';

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; picture?: string | null };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function me(): Promise<LoginResponse['user']> {
  const { data } = await api.get('/auth/me');
  return data.user || data; // backend may return { user } or user directly
}

export async function googleLogin(idToken: string): Promise<LoginResponse> {
  const { data } = await api.post('/auth/google', { idToken });
  return data;
}
