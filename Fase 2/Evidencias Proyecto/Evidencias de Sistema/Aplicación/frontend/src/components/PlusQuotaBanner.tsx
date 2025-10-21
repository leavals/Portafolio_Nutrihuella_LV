// src/components/PlusQuotaBanner.tsx
'use client';

import React from 'react';
import { Crown, X } from 'lucide-react';

type Props = {
  kind: 'pets' | 'favorites' | 'generations';
  quota?: { used: number; limit: number; resetAt?: string | null };
  onUpgrade: () => void;
  onClose?: () => void;
};

const titles: Record<Props['kind'], string> = {
  pets: 'Máximo de mascotas alcanzado',
  favorites: 'Máximo de favoritos alcanzado',
  generations: 'Máximo diario de recetas alcanzado',
};

export default function PlusQuotaBanner({ kind, quota, onUpgrade, onClose }: Props) {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl border bg-amber-50 text-amber-900 p-3 flex items-center gap-3 shadow-sm">
      <Crown className="h-4 w-4" />
      <div className="text-sm flex-1">
        <strong>{titles[kind]}</strong>{' '}
        {quota ? `(uso: ${quota.used}/${quota.limit}${quota.resetAt ? ` · reinicia: ${new Date(quota.resetAt).toLocaleTimeString()}` : ''})` : ''}
        . Pásate a <span className="font-semibold">Plus</span> para desbloquearlo.
      </div>
      <button className="btn btn-primary btn-sm" onClick={onUpgrade}>Actualizar a Plus</button>
      {onClose && (
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
