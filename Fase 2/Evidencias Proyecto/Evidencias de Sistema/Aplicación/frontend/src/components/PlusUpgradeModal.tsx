// src/components/PlusUpgradeModal.tsx
'use client';

import React from 'react';
import { Crown, X } from 'lucide-react';

type Quota = { used: number; limit: number; resetAt?: string | null } | undefined;

type Props = {
  open: boolean;
  kind: 'pets' | 'favorites' | 'generations';
  quota?: Quota;
  onUpgrade: () => void;
  onClose: () => void;
};

const labels: Record<Props['kind'], { title: string; desc: string }> = {
  pets: {
    title: 'Límite de mascotas alcanzado',
    desc: 'El plan Básico permite hasta 2 mascotas. Pásate a Plus para crear perfiles ilimitados.',
  },
  favorites: {
    title: 'Límite de favoritos alcanzado',
    desc: 'El plan Básico permite guardar 2 recetas en favoritos. Con Plus, guarda todas las que quieras.',
  },
  generations: {
    title: 'Límite de generaciones alcanzado',
    desc: 'Has llegado al máximo diario en el plan Básico. Con Plus, genera recetas sin límites.',
  },
};

export default function PlusUpgradeModal({ open, kind, quota, onUpgrade, onClose }: Props) {
  if (!open) return null;
  const l = labels[kind];

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-ink">{l.title}</h3>
            </div>
            <button className="rounded-lg p-1 hover:bg-slate-100" onClick={onClose} aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-sm text-slate-700">{l.desc}</p>
            {quota && (
              <div className="text-xs text-slate-600 bg-slate-50 border rounded-lg p-3">
                <div><strong>Uso:</strong> {quota.used}/{quota.limit}</div>
                {quota.resetAt && <div><strong>Se reinicia:</strong> {new Date(quota.resetAt).toLocaleString()}</div>}
              </div>
            )}
            <ul className="text-sm list-disc ml-5 mt-2 space-y-1">
              <li>Recetas y favoritos ilimitados</li>
              <li>Más estabilidad y rapidez</li>
              <li>Soporte prioritario</li>
            </ul>
          </div>

          <div className="px-5 py-4 bg-slate-50 border-t flex gap-3">
            <button className="btn btn-outline flex-1" onClick={onClose}>Luego</button>
            <button className="btn btn-primary flex-1" onClick={onUpgrade}>Actualizar a Plus</button>
          </div>
        </div>
      </div>
    </div>
  );
}
