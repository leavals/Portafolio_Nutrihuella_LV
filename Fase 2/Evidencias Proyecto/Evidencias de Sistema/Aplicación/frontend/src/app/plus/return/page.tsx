// src/app/plus/return/page.tsx
'use client';

/**
 * Página de retorno desde Transbank.
 *
 * - Toma el parámetro `token_ws` de la URL (o detecta si vino `TBK_TOKEN` en caso de anulación).
 * - Llama al backend en /api/payments/plus/commit enviando { token_ws }.
 * - Si el backend autoriza, navega a /plus/success. Si no, muestra el motivo.
 *
 * NOTA: Antes se enviaba { token }, lo que provocaba el error "token_ws requerido".
 *       Este fix asegura que el payload sea { token_ws }.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PlusReturnPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'pending' | 'ok' | 'fail'>('pending');
  const [message, setMessage] = useState<string>('Procesando pago…');

  useEffect(() => {
    let cancelled = false;

    // Transbank retorna:
    //  - token_ws (transacción normal a confirmar)
    //  - TBK_TOKEN (si el pagador canceló/abandonó)
    const token_ws = sp.get('token_ws');
    const tbkToken = sp.get('TBK_TOKEN');

    // Caso anulado/cancelado por el usuario
    if (!token_ws && tbkToken) {
      setStatus('fail');
      setMessage('La transacción fue cancelada por el usuario.');
      return;
    }

    // Si no llegó token_ws, no se puede confirmar
    if (!token_ws) {
      setStatus('fail');
      setMessage('token_ws requerido');
      return;
    }

    (async () => {
      try {
        // IMPORTANTE: enviar { token_ws }, no { token }
        const res = await api.post('/api/payments/plus/commit', { token_ws });

        // Compatibilidad con distintas respuestas del backend:
        const authorized =
          res?.ok === true ||
          res?.authorized === true ||
          res?.status === 'AUTHORIZED' ||
          res?.status === 'OK';

        if (authorized) {
          if (cancelled) return;
          setStatus('ok');
          setMessage('Pago autorizado. Actualizando tu plan…');
          // Redirige a la pantalla de éxito
          setTimeout(() => router.replace('/plus/success'), 800);
        } else {
          if (cancelled) return;
          setStatus('fail');
          setMessage(
            res?.message ||
              'El pago no fue autorizado. Si el cargo aparece en tu banco, se reversará automáticamente en pocos minutos.'
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setStatus('fail');
        setMessage(e?.message || 'No fue posible confirmar el pago.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sp, router]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">Volviendo de Transbank…</h1>
      <p className="text-sm text-slate-600">{message}</p>

      {status === 'fail' && (
        <div className="mt-4">
          <a className="btn btn-outline" href="/profile">
            Volver al perfil
          </a>
        </div>
      )}
    </div>
  );
}
