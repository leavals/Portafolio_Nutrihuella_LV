import { default as jsonTextLib } from '@/lib/jsonText';

// Extrae el primer bloque JSON válido de un texto del modelo
export function extractJson(text: string): any | null {
  try {
    // si la lib del repo existe y funciona:
    const jt = (jsonTextLib as any);
    if (typeof jt === 'function') {
      const s = jt(text);
      return JSON.parse(s);
    }
  } catch {}

  // fallback: regex simple entre { ... }
  const match = text.match(/\{[\s\S]*\}$/m);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
