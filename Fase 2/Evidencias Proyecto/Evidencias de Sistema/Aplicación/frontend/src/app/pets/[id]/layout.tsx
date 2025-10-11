"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Button, Card } from "@/components/ui";
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
    if (href === base) return pathname === href || pathname === `${href}/`;
    return pathname.startsWith(href);
  };

  // Detectar si estamos en la pestaña "Resumen"
  const isResumenPage = pathname === base || pathname === `${base}/`;

  return (
    <div className="space-y-4">
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

          <div className="shrink-0 flex items-center gap-2">
            <Link href={`${base}/edit`} className="btn btn-outline">
              Editar
            </Link>

            {isResumenPage ? (
              <Link href="/pets" className="underline">
                <Button variant="primary" className="text-white">
                  ← Volver a mascotas
                </Button>
              </Link>
            ) : (
              <Link href={`/pets/${id}`}>
                <Button variant="primary" className="text-white">
                  ← Volver
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div>{children}</div>
    </div>
  );
}
