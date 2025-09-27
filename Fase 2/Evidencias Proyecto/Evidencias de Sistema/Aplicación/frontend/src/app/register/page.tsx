import Image from "next/image";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] grid place-items-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-white grid grid-cols-1 md:grid-cols-2">
        {/* Imagen izquierda */}
        <div className="relative min-h-[360px] hidden md:block">
          <Image src="/nutrihuella/recipe-thumb.png" alt="NutriHuella" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full bg-white/95 shadow-lg grid place-items-center">
              <Image src="/nutrihuella/logo-mark.png" alt="Logo" width={96} height={96} />
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold text-ink">Regístrate</h1>
          <p className="text-sm text-muted mt-1 mb-6">
            Crea tu cuenta con correo y contraseña o continúa con Google.
          </p>

          <RegisterForm showTitle={false} />
        </div>
      </div>
    </div>
  );
}
