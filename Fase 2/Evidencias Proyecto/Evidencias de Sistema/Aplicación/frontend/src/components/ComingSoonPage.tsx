// src/components/ComingSoonPage.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  description?: string;
  backHref?: string; // por defecto "/"
};

export default function ComingSoonPage({
  title = "Página en construcción",
  description = "Estamos trabajando en esta sección. ¡Próximamente disponible! 🚀",
  backHref = "/",
}: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="p-8 bg-white rounded-xl shadow-lg text-center max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <Image
            src="/nutrihuella/boxer-construction.png"
            alt="En construcción"
            width={240}
            height={240}
            className="rounded-lg object-contain"
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <button onClick={() => router.push(backHref)} className="btn btn-primary">
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
