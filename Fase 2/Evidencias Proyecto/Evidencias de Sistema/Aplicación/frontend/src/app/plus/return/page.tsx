// src/app/plus/return/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PlusReturnPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'ok' | 'fail'>('pending');
  const [message, setMessage] = useState<string>('Procesando pago…');

  useEffect(() => {
    const token = sp.get('token_ws') || sp.get('TBK_TOKEN') || sp.get('token') || null;
    if (!token) {
      setStatus('fail');
      setMessage('No se recibió el token de Transbank.');
      return;
    }

    (async () => {
      try {
        const res = await api.post('/api/payments/plus/commit', { token });
        // Si tu backend devuelve {ok:true} o {status:'AUTHORIZED'}:
        const ok = res?.ok === true || res?.status === 'AUTHORIZED';
        if (ok) {
          setStatus('ok');
          setMessage('Pago autorizado. Actualizando tu plan…');
          setTimeout(() => router.replace('/plus/success'), 800);
        } else {
          setStatus('fail');
          setMessage('El pago no fue autorizado.');
        }
      } catch (e: any) {
        setStatus('fail');
        setMessage(e?.message || 'No fue posible confirmar el pago.');
      }
    })();
  }, [sp, router]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">Volviendo de Transbank…</h1>
      <p className="text-sm text-slate-600">{message}</p>
      {status === 'fail' && (
        <div className="mt-4">
          <a className="btn btn-outline" href="/profile">Volver al perfil</a>
        </div>
      )}
    </div>
  );
}
