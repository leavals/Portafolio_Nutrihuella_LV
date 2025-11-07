'use client';

export type DogTip = { id: string; text: string };

const TIPS_URL = '/compendium/tips.dog.general.json';

export async function getDogTips(): Promise<DogTip[]> {
  try {
    const res = await fetch(TIPS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.tips ?? []) as DogTip[];
  } catch {
    // Fallback si falla el fetch o aún no pones el JSON en /public
    return [
      { id: 'DOG-FALLBACK-1', text: 'Cambia el agua del bebedero todos los días porque si no se forman microorganismos.' },
      { id: 'DOG-FALLBACK-2', text: 'Usa correa en espacios públicos porque evita accidentes y conflictos.' },
      { id: 'DOG-FALLBACK-3', text: 'Evita chocolate, uvas y pasas porque son tóxicos para los perros.' },
    ];
  }
}

export function pickRandom<T extends { id: string }>(arr: T[], prevId?: string): T | null {
  if (!arr.length) return null;
  if (arr.length === 1) return arr[0];
  let tip: T;
  do {
    tip = arr[Math.floor(Math.random() * arr.length)];
  } while (tip.id === prevId);
  return tip;
}
