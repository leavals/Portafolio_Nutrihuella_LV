'use client';
import { RecipePlan } from '@/types/recipe';

export default function RecipeView({
  plan,
  onAddFavorite,
  adding = false,
}: {
  plan: RecipePlan;
  onAddFavorite?: () => Promise<void> | void;
  adding?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl bg-white/80 backdrop-blur rounded-2xl shadow p-6 md:p-8 border">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-semibold">{plan.title}</h2>
        {onAddFavorite && (
          <button
            onClick={() => onAddFavorite()}
            disabled={adding}
            className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            {adding ? 'Guardando…' : 'Agregar a favoritos'}
          </button>
        )}
      </div>

      {(plan.goal || plan.constraints) && (
        <div className="mt-3 text-sm text-slate-600 space-y-1">
          {plan.goal && <p><strong>Objetivo:</strong> {plan.goal}</p>}
          {plan.constraints && (
            <p><strong>Restricciones:</strong> {Array.isArray(plan.constraints) ? plan.constraints.join(', ') : plan.constraints}</p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {plan.meals?.map((m, idx) => (
          <div key={idx} className="rounded-xl border bg-white/70 p-4">
            <h3 className="font-medium mb-2">{m.name}</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {m.items?.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {plan.disclaimer && (
        <p className="mt-6 text-xs text-slate-500">⚠️ {plan.disclaimer}</p>
      )}
    </div>
  );
}
