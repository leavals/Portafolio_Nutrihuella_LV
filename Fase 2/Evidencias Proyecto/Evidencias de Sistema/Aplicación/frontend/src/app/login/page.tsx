import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] grid place-items-center px-4 py-8">
      {/* Contenedor centrado con la misma estética del modal */}
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-white grid grid-cols-1 md:grid-cols-2">
        {/* Izquierda: imagen + logo redondo (oculta en mobile) */}
        <div className="relative min-h-[360px] hidden md:block">
          <Image
            src="/nutrihuella/recipe-thumb.png"
            alt="NutriHuella"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full bg-white/95 shadow-lg grid place-items-center">
              <Image
                src="/nutrihuella/logo-mark.png"
                alt="Logo"
                width={96}
                height={96}
              />
            </div>
          </div>
        </div>

        {/* Derecha: formulario (reusa el mismo componente del modal) */}
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold text-ink">Iniciar sesión</h1>
          <p className="text-sm text-muted mt-1 mb-6">
            Accede con tu correo y contraseña o usa Google.
          </p>

          {/* el LoginForm navega a /dashboard al éxito si no se le pasa onSuccess */}
          <LoginForm showTitle={false} />
        </div>
      </div>
    </div>
  );
}
