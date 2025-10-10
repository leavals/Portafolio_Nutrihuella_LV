import * as SecureStore from 'expo-secure-store';
const isWeb = typeof window !== 'undefined';

export async function getItem(key: string) {
  if (isWeb) { try { return window.localStorage.getItem(key); } catch { return null; } }
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}
export async function setItem(key: string, value: string) {
  if (isWeb) { try { window.localStorage.setItem(key, value); } catch {} ; return; }
  try { await SecureStore.setItemAsync(key, value); } catch {}
}
export async function deleteItem(key: string) {
  if (isWeb) { try { window.localStorage.removeItem(key); } catch {} ; return; }
  try { await SecureStore.deleteItemAsync(key); } catch {}
}
