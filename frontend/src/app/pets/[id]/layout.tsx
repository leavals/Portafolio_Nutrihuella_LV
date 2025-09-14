"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Card } from "@/components/ui";
import clsx from "clsx";

export default function PetTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const base = `/pets/${id}`;

  const tabs = [
    { href: `${base}`, label: "Resumen" },
    { href: `${base}/clinical`, label: "Clínica" },
    { href: `${base}/nutrition`, label: "Nutrición" },
    { href: `${base}/vaccines`, label: "Vacunas" },
    { href: `${base}/diseases`, label: "Enfermedades" },
    { href: `${base}/weights`, label: "Pesos" },
  ];

  const isActive = (href: string) => {
    // Base exacta o con slash; subrutas empiezan por href
    if (href === base) return pathname === href || pathname === `${href}/`;
    return pathname.startsWith(href);
  };

  return (
    <div className="space-y-4">
      {/* Barra de pestañas persistente */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive(t.href) ? "page" : undefined}
                className={clsx(
                  "btn",
                  isActive(t.href) ? "btn-primary" : "btn-ghost"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="shrink-0">
            <Link href={`${base}/edit`} className="btn btn-outline">
              Editar
            </Link>
          </div>
        </div>
      </Card>

      {/* Contenido específico de cada subruta */}
      <div>{children}</div>
    </div>
  );
}
