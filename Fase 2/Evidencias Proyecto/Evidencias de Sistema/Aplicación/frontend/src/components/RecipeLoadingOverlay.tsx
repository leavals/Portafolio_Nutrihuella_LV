'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { onRecipeLoading, requestNextTip } from '@/lib/recipeLoadingBus';
import { DogTip, getDogTips, pickRandom } from '@/utils/dogTips';

type UIState =
  | { open: false }
  | { open: true; title: string; subtitle: string; cancel?: () => void };

export default function RecipeLoadingOverlay() {
  const [tips, setTips] = useState<DogTip[]>([]);
  const [currentTip, setCurrentTip] = useState<DogTip | null>(null);
  const [ui, setUi] = useState<UIState>({ open: false });

  useEffect(() => {
    const unsub = onRecipeLoading((e) => {
      if (e.type === 'open') {
        const { payload, controller } = e;
        setUi({
          open: true,
          title: payload.title ?? 'Generando tu receta con IA…',
          subtitle: payload.subtitle ?? 'Esto puede tomar unos segundos. Puedes leer consejos mientras esperas.',
          cancel: () => controller.abort('user-cancel'),
        });
      } else if (e.type === 'close') {
        setUi({ open: false });
      } else if (e.type === 'nextTip') {
        setCurrentTip((prev) => pickRandom(tips, prev?.id) ?? prev ?? null);
      }
    });
    return unsub;
  }, [tips]);

  useEffect(() => {
    let mounted = true;
    getDogTips().then((all) => {
      if (!mounted) return;
      setTips(all);
      setCurrentTip((prev) => prev ?? pickRandom(all) ?? null);
    });
    return () => { mounted = false; };
  }, []);

  // Esc para cancelar
  useEffect(() => {
    if (!ui.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') ui.cancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui]);

  const canPortal = useMemo(() => typeof window !== 'undefined', []);
  if (!ui.open || !canPortal) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 z-[1001] grid place-items-center" role="dialog" aria-modal="true" aria-label="Generando receta">
        <div className="w-[min(560px,92vw)] rounded-2xl bg-white p-5 text-gray-900 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" aria-hidden="true" />
            <div>
              <div className="text-base font-semibold">{ui.title}</div>
              <div className="mt-0.5 text-sm text-gray-600">{ui.subtitle}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="mb-1.5 text-xs uppercase tracking-wide text-gray-500">Consejo rápido</div>
            <div className="text-sm leading-relaxed">{currentTip?.text ?? 'Cargando consejos…'}</div>
            <div className="mt-2 text-xs text-gray-500">Pulsa “Cambiar consejo” para ver otro.</div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => requestNextTip()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100"
            >
              Cambiar consejo
            </button>
            <button
              type="button"
              onClick={() => ui.cancel?.()}
              className="btn btn-primary"
              title="Cancelar generación"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
