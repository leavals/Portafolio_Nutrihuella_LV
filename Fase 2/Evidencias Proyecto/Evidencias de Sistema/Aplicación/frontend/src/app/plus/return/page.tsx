// src/app/plus/return/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';            // wrapper fetch a :4000
import { useAuth } from '@/lib/auth-context';

type Phase = 'committing' | 'polling' | 'ok' | 'fail';

const MAX_POLLS = 8;      // intentos de verificación
const POLL_DELAY = 1500;  // ms entre intentos

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PlusReturnPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { isPlus, refresh } = useAuth();

  const [phase, setPhase] = useState<Phase>('committing');
  const [detail, setDetail] = useState('Confirmando tu pago…');
  const running = useRef(false);

  const tokenWs = sp.get('token_ws');
  const tbkCancel = sp.get('TBK_TOKEN');   // Transbank manda esto si se anuló

  const title = useMemo(() => {
    switch (phase) {
      case 'committing': return 'Volviendo del proveedor de pago…';
      case 'polling':    return 'Verificando acreditación…';
      case 'ok':         return 'Pago confirmado';
      case 'fail':       return 'No se pudo confirmar el pago';
      default:           return 'Volviendo del proveedor de pago…';
    }
  }, [phase]);

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    (async () => {
      if (tbkCancel) {
        setPhase('fail');
        setDetail('La transacción fue cancelada por el usuario.');
        return;
      }
      if (!tokenWs) {
        setPhase('fail');
        setDetail('token_ws requerido.');
        return;
      }

      try {
        // 1) Intento normal de commit
        setPhase('committing');
        setDetail('Confirmando tu pago…');
        await api.post('/api/payments/plus/commit', { token_ws: tokenWs });

        // 2) Refrescar sesión/plan
        await refresh();

        // 3) Si ya somos PLUS → éxito
        if (isPlus) {
          setPhase('ok');
          setDetail('¡Listo! Tu cuenta ya es Plus. Redirigiendo…');
          router.replace('/plus/success');
          return;
        }

        // 4) Puede demorar la propagación → polling
        setPhase('polling');
        setDetail('Pago confirmado. Verificando tu cuenta unos segundos…');
        for (let i = 0; i < MAX_POLLS; i++) {
          await sleep(POLL_DELAY);
          await refresh();
          if (isPlus) {
            setPhase('ok');
            setDetail('¡Listo! Tu cuenta ya es Plus. Redirigiendo…');
            router.replace('/plus/success');
            return;
          }
        }
        setPhase('fail');
        setDetail('Confirmamos el pago pero no pudimos sincronizar tu cuenta. Actualiza la página o vuelve al inicio.');
      } catch (e: any) {
        // 5) Fallback total si el commit falla por CORS/red
        setPhase('polling');
        setDetail('No pudimos confirmar directamente. Verificando estado de tu cuenta…');
        for (let i = 0; i < MAX_POLLS; i++) {
          await sleep(POLL_DELAY);
          await refresh();
          if (isPlus) {
            setPhase('ok');
            setDetail('¡Pago acreditado! Redirigiendo…');
            router.replace('/plus/success');
            return;
          }
        }
        setPhase('fail');
        setDetail(e?.message || 'No se pudo verificar la transacción.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    running.current = false;
    setPhase('committing');
    setDetail('Reintentando confirmar tu pago…');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-slate-600">{detail}</p>

      {phase === 'fail' && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button onClick={retry} className="btn btn-primary">Reintentar</button>
          <a className="btn btn-outline" href="/profile">Volver al perfil</a>
        </div>
      )}
    </div>
  );
}
