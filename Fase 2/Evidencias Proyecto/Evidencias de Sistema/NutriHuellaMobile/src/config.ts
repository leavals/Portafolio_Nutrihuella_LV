const isWeb = typeof window !== 'undefined';
const DEFAULT_BASE = isWeb ? 'http://localhost:4000' : 'http://192.168.0.10:4000';
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE).replace(/\/$/, '');
export const API_URL = `${API_BASE}/api`;
