// src/components/recipes/RecipeCard.tsx
'use client';
/**
 * Tarjeta de receta con botones de "Guardar en favoritos" y feedback.
 * - Deshabilita el botón mientras guarda.
 * - Muestra un banner de éxito o error acorde al diseño (sin alert()).
 */
import React, { useState } from 'react';

export default function RecipeCard({
  data,
  onFavorite,
  onFeedback,
}: {
  data: any;
  onFavorite: () => Promise<void> | void;
  onFeedback: (vote: -1 | 1) => void;
}) {
  const { title, planType, totalDailyKcal, meals, notes, warnings, disclaimer } = data || {};

  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  async function handleFavorite() {
    setBanner(null);
    setSaving(true);
    try {
      await Promise.resolve(onFavorite?.());
      setBanner({ kind: 'ok', msg: 'Guardado en favoritos' });
    } catch (e: any) {
      setBanner({ kind: 'err', msg: e?.message || 'No se pudo guardar en favoritos' });
    } finally {
      setSaving(false);
      // Oculta el banner luego de unos segundos (opcional)
      setTimeout(() => setBanner(null), 3000);
    }
  }

  return (
    <div className="w-full max-w-3xl bg-white rounded-xl shadow p-5 border border-emerald-900/10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-[#10776F]">{title}</h2>
        <span className="text-xs px-2 py-1 rounded-full border border-emerald-700 text-emerald-700">
          {planType}
        </span>
      </div>

      {typeof totalDailyKcal === 'number' && (
        <p className="text-sm text-gray-600 mt-1">
          Kcal diarias (estimadas): <b>{totalDailyKcal}</b>
        </p>
      )}

      {/* Banner de estado */}
      {banner && (
        <div
          className={
            banner.kind === 'ok'
              ? 'mt-3 rounded-xl border bg-[#ECFDF5] border-[#10B981]/30 text-[#065F46] px-3 py-2 text-sm'
              : 'mt-3 rounded-xl border bg-[#FEF2F2] border-[#EF4444]/30 text-[#991B1B] px-3 py-2 text-sm'
          }
        >
          {banner.msg}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {(meals ?? []).map((m: any, idx: number) => (
          <div key={idx} className="border rounded-lg p-3 bg-[#FFF8EB]">
            <h3 className="font-bold text-[#10776F]">
              {m.name}
              {m.kcal ? ` • ${m.kcal} kcal` : ''}
            </h3>
            <p className="text-sm mt-2">
              <b>Instrucciones:</b> {m.instructions}
            </p>
            <ul className="list-disc ml-6 mt-2">
              {(m.ingredients ?? []).map((ing: any, i: number) => (
                <li key={i} className="text-sm">
                  {ing.name}
                  {ing.qty || ing.unit ? `: ${ing.qty ?? ''}${ing.unit ?? ''}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {notes && (
        <p className="text-sm text-gray-700 mt-4">
          <b>Notas:</b> {notes}
        </p>
      )}

      {warnings?.length ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-amber-700">Advertencias:</p>
          <ul className="list-disc ml-6 text-sm text-amber-800">
            {warnings.map((w: string, i: number) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleFavorite}
          className="px-4 py-2 bg-[#10776F] text-white rounded-lg font-semibold disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar en favoritos'}
        </button>
        <button
          onClick={() => onFeedback(1)}
          className="px-3 py-2 border rounded-lg text-emerald-700 border-emerald-700"
        >
          👍
        </button>
        <button
          onClick={() => onFeedback(-1)}
          className="px-3 py-2 border rounded-lg text-rose-700 border-rose-700"
        >
          👎
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">{disclaimer}</p>
    </div>
  );
}
