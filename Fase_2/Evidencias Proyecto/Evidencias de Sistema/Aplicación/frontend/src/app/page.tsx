// src/app/page.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* IZQUIERDA: GLASS + 2 CARDS BLANCAS */}
      <aside className="self-start rounded-2xl glass p-4 sm:p-6 lg:p-8 border border-[--nh-border]">
        <div className="mx-auto w-full max-w-xl space-y-4">
          <section className="card p-6 shadow text-center">
            <h2 className="text-2xl font-semibold text-ink">Genera tu dieta</h2>
            <p className="mt-2 text-sm text-muted">
              Genera una dieta para tu mascota a partir de los alimentos disponibles en tu despensa.
            </p>
            <Link href="/diet/generate" className="mt-5 btn btn-primary mx-auto">
              <Image src="/nutrihuella/icons/lucide_dog.png" width={20} height={20} alt="Perrito" />
              Genera tu dieta
            </Link>
          </section>

          <section className="card p-6 shadow text-center">
            <h2 className="text-2xl font-semibold text-ink">Añade alimentos a tu despensa</h2>
            <p className="mt-2 text-sm text-muted">
              Edita tu despensa con los alimentos que tengas en casa y podrás acceder a “Genera tu dieta”.
            </p>
            <Link href="/pantry" className="mt-5 btn btn-accent mx-auto">
              <Image src="/nutrihuella/icons/recipe.png" width={20} height={20} alt="Receta" />
              Tu despensa
            </Link>
          </section>
        </div>
      </aside>

      {/* DERECHA: GLASS externo + CARD blanca interna */}
      <section className="rounded-2xl glass p-4 sm:p-6 lg:p-8 border border-[--nh-border]">
        <div className="rounded-xl bg-white border border-[--nh-border] shadow p-6 sm:p-7 lg:p-8">
          <h2 className="text-3xl font-semibold text-ink">Recetas recomendadas</h2>

          <ul className="mt-6 space-y-8">
            {[1, 2, 3].map((i) => (
              <li key={i}>
                {/* 2 columnas fijas: 182px / 1fr */}
                <div
                  className="grid gap-6 items-start"
                  style={{ gridTemplateColumns: '182px 1fr' }}
                >
                  {/* Columna izquierda: título + miniatura */}
                  <div>
                    <div className="text-sm font-medium text-ink mb-2">Lorem ipsum</div>
                    <Image
                      src="/nutrihuella/recipe-thumb.png"
                      alt="Receta recomendada"
                      width={182}
                      height={228}
                      className="w-[182px] h-[228px] rounded-lg object-cover"
                      priority={i === 1}
                    />
                  </div>

                  {/* Columna derecha: descripción con un poco de separación arriba */}
                  <div className="pt-3 sm:pt-4">
                    <p className="text-sm text-muted leading-relaxed">
                      Lorem ipsum nunc etiam amet dictum in dolor sapien volutpat mauris quis
                      consequat a tortor quisque nulla et pulvinar in. Lorem ipsum nunc etiam amet
                      dictum in dolor sapien volutpat mauris quis consequat a tortor quisque nulla
                      et pulvinar in.
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
