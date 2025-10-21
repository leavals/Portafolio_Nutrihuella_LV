// src/app/plus/success/page.tsx
'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';

export default function PlusSuccessPage() {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border p-8 text-center">
      <div className="flex justify-center mb-3">
        <Crown className="h-10 w-10 text-amber-500" />
      </div>
      <h1 className="text-2xl font-semibold">¡Bienvenido a NutriHuella Plus!</h1>
      <p className="text-sm text-slate-600 mt-2">
        Tu cuenta fue actualizada con éxito. Ya no tendrás límites de mascotas, favoritos ni generaciones de recetas.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/recipes/generator" className="btn btn-primary">Generar recetas</Link>
        <Link href="/pets" className="btn btn-outline">Ver mis mascotas</Link>
      </div>
    </div>
  );
}
