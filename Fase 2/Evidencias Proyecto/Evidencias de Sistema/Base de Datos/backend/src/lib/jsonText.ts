// src/lib/jsonText.ts
export class JSONHelper {
  /**
   * Convierte un array a string JSON para guardar en Prisma.
   * Si recibe null/undefined, devuelve '[]'.
   */
  static toText(arr: unknown[] | null | undefined): string {
    if (!arr || !Array.isArray(arr)) return "[]";
    return JSON.stringify(arr);
  }

  /**
   * Convierte string JSON a array.
   * Si no es un JSON válido o es null/undefined, devuelve [].
   */
  static toArray<T = any>(text: string | null | undefined): T[] {
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
