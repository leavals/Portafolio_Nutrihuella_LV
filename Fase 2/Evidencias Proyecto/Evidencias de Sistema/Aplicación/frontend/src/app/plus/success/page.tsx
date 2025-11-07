// src/app/plus/success/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';

export default function PlusSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // No llamar refresh() aquí: provoca loops.
    const t = setTimeout(() => {
      router.replace('/?m=plus-ok'); // tu home autenticado + query para toast
    }, 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border p-8 text-center">
      <div className="flex justify-center mb-3">
        <Crown className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-semibold">¡Bienvenido a NutriHuella Plus!</h1>
      <p className="text-sm text-slate-600 mt-2">
        Tu cuenta fue actualizada con éxito. En un momento te llevamos al inicio.
      </p>
      <div className="mt-6">
        <Link href="/?m=plus-ok" className="btn btn-primary">Ir ahora</Link>
      </div>
    </div>
  );
}
